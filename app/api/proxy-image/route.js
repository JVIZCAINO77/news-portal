
import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Proxy de imágenes ultra-optimizado para Imperio Público 2.0.
 * Utiliza Edge Runtime, streaming y caché agresiva en el CDN de Vercel.
 * Simula un navegador real para bypassar hotlink protection.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('URL missing', { status: 400 });
  }

  // Normalizar URL
  let finalUrl = imageUrl;
  if (finalUrl.startsWith('//')) finalUrl = `https:${finalUrl}`;
  if (finalUrl.startsWith('http://')) finalUrl = finalUrl.replace('http://', 'https://');

  // AbortController para timeout estricto
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  // Headers que simulan un navegador Chrome real para bypassar hotlink protection
  const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Accept-Language': 'es-DO,es;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Sec-Fetch-Dest': 'image',
    'Sec-Fetch-Mode': 'no-cors',
    'Sec-Fetch-Site': 'cross-site',
    'DNT': '1',
  };

  try {
    // Intento 1: Con Referer del mismo dominio de la imagen (bypassa la mayoría de protecciones)
    const fetchWithReferer = async () => {
      const headers = { ...BROWSER_HEADERS };
      try {
        headers['Referer'] = new URL(finalUrl).origin + '/';
      } catch (_) {}
      return fetch(finalUrl, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
    };

    // Intento 2: Sin Referer (algunos sitios bloquean referers externos)
    const fetchWithoutReferer = async () => {
      const headers = { ...BROWSER_HEADERS };
      delete headers['Referer'];
      return fetch(finalUrl, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
      });
    };

    // Intento 3: User-Agent de bot de Google (algunos sitios permiten bots)
    const fetchAsGooglebot = async () => {
      return fetch(finalUrl, {
        headers: {
          'User-Agent': 'Googlebot-Image/1.0',
          'Accept': 'image/*,*/*',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
    };

    let response = await fetchWithReferer();

    if (!response.ok && (response.status === 403 || response.status === 401 || response.status === 406)) {
      response = await fetchWithoutReferer();
    }

    if (!response.ok && (response.status === 403 || response.status === 401)) {
      response = await fetchAsGooglebot();
    }

    if (!response.ok) {
      return new NextResponse(`Failed: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';

    // Solo permitimos imágenes reales
    if (contentType && !contentType.startsWith('image/') && !contentType.includes('application/octet-stream')) {
      return new NextResponse('Invalid content type', { status: 415 });
    }

    // Caché ultra-agresiva — s-maxage y stale-while-revalidate evitan re-ejecuciones de la función
    const cacheHeaders = {
      'Content-Type': contentType || 'image/jpeg',
      'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=31536000, max-age=31536000, immutable',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff',
    };

    // Retornamos el body como stream — el Edge no carga la imagen completa en memoria
    return new NextResponse(response.body, { headers: cacheHeaders });

  } catch (error) {
    if (error.name === 'AbortError') {
      return new NextResponse('Timeout', { status: 504 });
    }
    return new NextResponse(null, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
