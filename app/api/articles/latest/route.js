import { getLatestArticles, getArticlesPaginated } from '@/lib/serverData';
import { NextResponse } from 'next/server';

// NOTA: NO usar force-dynamic — el CDN gestiona el caché con s-maxage=300 en los headers.
// NOTA: Edge Runtime eliminado — @supabase/supabase-js usa APIs de Node.js (Buffer, crypto)
//       que no están disponibles en Edge Runtime y causan errores silenciosos en producción.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawLimit  = parseInt(searchParams.get('limit')  || '10');
  const rawOffset = parseInt(searchParams.get('offset') || '0');
  const limit  = isNaN(rawLimit)  ? 10 : Math.min(Math.max(rawLimit,  1), 50);
  const offset = isNaN(rawOffset) ?  0 : Math.min(Math.max(rawOffset, 0), 10000);

  try {
    // Si se provee offset > 0, usar paginación; si no, usar latest (más eficiente)
    const articles = offset > 0
      ? await getArticlesPaginated(limit, offset)
      : await getLatestArticles(limit);

    return NextResponse.json(articles, {
      headers: {
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
