import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());

    const startToday = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
    const endToday   = new Date(`${todayDR}T23:59:59-04:00`).toISOString();

    // Total artículos
    const { count: total }   = await supabase.from('articles').select('*', { count: 'exact', head: true });
    const { count: today }   = await supabase.from('articles').select('*', { count: 'exact', head: true }).gte('publishedAt', startToday).lte('publishedAt', endToday);
    const { count: noImage } = await supabase.from('articles').select('*', { count: 'exact', head: true }).or('image.is.null,image.eq.');

    // Artículos por categoría
    const { data: byCat } = await supabase.from('articles').select('category');
    const catCounts = {};
    (byCat || []).forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });

    // Duplicados por source_link
    const { data: links } = await supabase.from('articles').select('source_link').not('source_link', 'is', null);
    const linkMap = {};
    (links || []).forEach(a => { linkMap[a.source_link] = (linkMap[a.source_link] || 0) + 1; });
    const dupes = Object.values(linkMap).filter(n => n > 1).length;

    // Estado de claves Gemini
    const geminiKeys = (process.env.GEMINI_API_KEY || '').split(',').filter(Boolean);

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        total_articles: total,
        published_today: today,
        missing_images: noImage,
        duplicate_sources: dupes,
        by_category: catCounts,
      },
      config: {
        gemini_keys_configured: geminiKeys.length,
        site_url: process.env.NEXT_PUBLIC_SITE_URL,
        adsense_id: process.env.NEXT_PUBLIC_ADSENSE_ID,
      },
      score: {
        db_health: noImage === 0 && dupes === 0 ? 'PERFECT' : noImage < 5 && dupes < 3 ? 'GOOD' : 'NEEDS_ATTENTION',
        publishing: today >= 6 ? 'ACTIVE' : today >= 1 ? 'REDUCED' : 'INACTIVE',
      }
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
