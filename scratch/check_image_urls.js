/**
 * check_image_urls.js
 * Muestra las URLs de imagen de los artículos más recientes para diagnosticar.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function isAccessible(url) {
  if (!url) return '⬛ NULL';
  if (url.includes('cloudinary.com')) return '☁️ cloudinary';
  if (url.includes('unsplash.com')) return '✅ unsplash';
  if (url.includes('pollinations.ai')) return '❌ pollinations';
  try {
    const c = new AbortController();
    setTimeout(() => c.abort(), 4000);
    const r = await fetch(url, { method: 'HEAD', signal: c.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    return r.ok ? `✅ OK (${r.status})` : `❌ ROTA (${r.status})`;
  } catch (e) {
    return `❌ ERROR (${e.message.slice(0, 30)})`;
  }
}

async function main() {
  const { data } = await supabase
    .from('articles')
    .select('id, title, image, category, publishedAt')
    .order('publishedAt', { ascending: false })
    .limit(20);

  console.log('Últimos 20 artículos — estado de imagen:\n');
  for (const a of data || []) {
    const status = await isAccessible(a.image);
    const domain = a.image ? (a.image.startsWith('http') ? new URL(a.image).hostname.replace('www.','').slice(0,30) : 'relativa') : 'sin imagen';
    console.log(`${status} [${a.category?.padEnd(15)}] "${a.title?.slice(0,45)}" → ${domain}`);
  }
}

main().catch(console.error);
