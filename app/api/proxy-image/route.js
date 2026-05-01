
import { NextResponse } from 'next/server';

/**
 * Proxy de imágenes para evitar bloqueos de hotlinking (Referer).
 * El servidor descarga la imagen y la sirve directamente al navegador.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('URL missing', { status: 400 });
  }

  try {
    console.log(`[ImageProxy] Fetching: ${imageUrl}`);
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      next: { revalidate: 3600 } // Cachear por 1 hora
    });

    if (!response.ok) {
      console.error(`[ImageProxy] External fetch failed: ${response.status} ${response.statusText}`);
      return new NextResponse(`Failed to fetch: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[ImageProxy Error]:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}


