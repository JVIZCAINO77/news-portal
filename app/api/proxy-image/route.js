
import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Uso de Edge Runtime para reducir consumo de CPU y latencia

/**
 * Proxy de imágenes ultra-optimizado para Imperio Público 2.0.
 * Utiliza Edge Runtime, streaming y caché agresiva en el CDN de Vercel.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('URL missing', { status: 400 });
  }

  // AbortController para timeout estricto (reducido a 10s para liberar recursos rápido)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    let finalUrl = imageUrl;
    if (finalUrl.startsWith('//')) {
      finalUrl = `https:${finalUrl}`;
    }

    const fetchImage = async (useReferer = true) => {
      const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      };
      
      if (useReferer) {
        try {
          headers['Referer'] = new URL(finalUrl).origin + '/';
        } catch (e) {}
      }

      return fetch(finalUrl, {
        headers,
        signal: controller.signal,
        redirect: 'follow',
        // Cache de fetch nativa de Next.js (si aplica en el entorno)
        next: { revalidate: 31536000 } 
      });
    };

    let response = await fetchImage(true);

    if (!response.ok && (response.status === 403 || response.status === 401)) {
      response = await fetchImage(false);
    }

    if (!response.ok) {
      return new NextResponse(`Failed: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    
    // Solo permitimos imágenes reales
    if (contentType && !contentType.startsWith('image/') && !contentType.includes('application/octet-stream')) {
       return new NextResponse('Invalid content type', { status: 415 });
    }

    // Cabeceras de caché ultra-agresivas
    // s-maxage y stale-while-revalidate son claves para que Vercel NO ejecute esta función de nuevo
    const cacheHeaders = {
      'Content-Type': contentType || 'image/jpeg',
      'Cache-Control': 'public, s-maxage=31536000, stale-while-revalidate=31536000, max-age=31536000, immutable',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    };

    // Retornamos el body como stream para que el Edge no tenga que cargar la imagen completa en memoria
    return new NextResponse(response.body, {
      headers: cacheHeaders,
    });

  } catch (error) {
    return new NextResponse(null, { status: 500 });
  } finally {
    clearTimeout(timeoutId);
  }
}
