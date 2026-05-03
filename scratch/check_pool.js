
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function getDailyTopArticles(limit = 12, minRequired = 6) {
  const now = new Date();
  let startOfDay, endOfDay;
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  startOfDay = new Date(`${todayStr}T00:00:00-04:00`).toISOString();
  endOfDay   = new Date(`${todayStr}T23:59:59-04:00`).toISOString();

  const { data: trendingToday } = await supabase
    .from('articles')
    .select('*')
    .eq('trending', true)
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay)
    .order('publishedAt', { ascending: false });

  const { data: featuredToday } = await supabase
    .from('articles')
    .select('*')
    .eq('featured', true)
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay)
    .order('publishedAt', { ascending: false });

  const { data: mostViewedToday } = await supabase
    .from('articles')
    .select('*')
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay)
    .order('views', { ascending: false });

  const seen = new Set();
  const combined = [];
  
  if (trendingToday) trendingToday.forEach(art => { if (!seen.has(art.id)) { seen.add(art.id); combined.push(art); } });
  if (featuredToday) featuredToday.forEach(art => { if (!seen.has(art.id)) { seen.add(art.id); combined.push(art); } });
  if (mostViewedToday) mostViewedToday.forEach(art => { if (!seen.has(art.id)) { seen.add(art.id); combined.push(art); } });

  if (combined.length < limit) {
    const { data: fallback } = await supabase
      .from('articles')
      .select('*')
      .order('publishedAt', { ascending: false })
      .limit(limit * 2);
    if (fallback) fallback.forEach(art => { if (!seen.has(art.id)) { seen.add(art.id); combined.push(art); } });
  }

  return combined.slice(0, limit);
}

getDailyTopArticles().then(pool => {
  console.log(JSON.stringify(pool.map(a => ({ id: a.id, title: a.title, image: a.image, trending: a.trending, featured: a.featured })), null, 2));
});
