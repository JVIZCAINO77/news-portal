import { getLatestArticles } from '@/lib/serverData';
import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Reducir CPU: Edge Runtime es más ligero que Node.js serverless

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    const articles = await getLatestArticles(limit);
    return NextResponse.json(articles, {
      headers: {
        // CDN cachea 60s; hasta 5min puede servir stale mientras revalida en background
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
