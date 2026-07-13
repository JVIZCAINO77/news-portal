import { getLatestArticles } from '@/lib/serverData';
import { NextResponse } from 'next/server';

// NOTA: NO usar force-dynamic — el CDN gestiona el caché con s-maxage=300 en los headers.
// NOTA: Edge Runtime eliminado — @supabase/supabase-js usa APIs de Node.js (Buffer, crypto)
//       que no están disponibles en Edge Runtime y causan errores silenciosos en producción.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // Máximo 50 — prevenimos abuso tipo ?limit=9999
  const rawLimit = parseInt(searchParams.get('limit') || '10');
  const limit = isNaN(rawLimit) ? 10 : Math.min(Math.max(rawLimit, 1), 50);

  try {
    const articles = await getLatestArticles(limit);
    return NextResponse.json(articles, {
      headers: {
        // CDN cachea 5 min; hasta 10 min puede servir stale mientras revalida en background
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, max-age=300',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
