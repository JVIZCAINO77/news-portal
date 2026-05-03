// app/api/articles/paginated/route.js
import { getArticlesPaginated } from '@/lib/serverData';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  // Validación: máx 50 artículos por página, offset no puede ser negativo ni absurdo
  const rawLimit  = parseInt(searchParams.get('limit')  || '10');
  const rawOffset = parseInt(searchParams.get('offset') || '0');
  const limit  = isNaN(rawLimit)  ? 10 : Math.min(Math.max(rawLimit,  1), 50);
  const offset = isNaN(rawOffset) ?  0 : Math.min(Math.max(rawOffset, 0), 10000);

  try {
    const articles = await getArticlesPaginated(limit, offset);
    return NextResponse.json(articles, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
