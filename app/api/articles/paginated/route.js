// app/api/articles/paginated/route.js
import { getArticlesPaginated } from '@/lib/serverData';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const articles = await getArticlesPaginated(limit, offset);
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}
