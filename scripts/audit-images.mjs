/**
 * audit-images.mjs
 * Reporte crudo: muestra la URL de imagen de CADA artículo para diagnóstico visual.
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vprjbntwebhzjjcnlztc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmpibnR3ZWJoempqY25senRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA4OTMwNSwiZXhwIjoyMDkwNjY1MzA1fQ.zdwco4O57L2X2xzuj0H28plAxWqRF6vwYJIl9qGLhGM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data: articles } = await supabase
  .from('articles')
  .select('id, title, category, image, slug, publishedAt')
  .order('publishedAt', { ascending: false })
  .limit(50); // Solo los 50 más recientes para diagnóstico

console.log(`\n== ÚLTIMOS 50 ARTÍCULOS Y SUS IMÁGENES ==\n`);

const imgTypes = { cloudinary: 0, unsplash: 0, pollinations: 0, null_empty: 0, other: 0 };
const imgUrlCount = new Map();

for (const a of articles) {
  const img = a.image || '';
  imgUrlCount.set(img, (imgUrlCount.get(img) || 0) + 1);

  let type = '';
  if (!img) { type = '🚫 NULL'; imgTypes.null_empty++; }
  else if (img.includes('cloudinary.com')) { type = '✅ CLOUDINARY'; imgTypes.cloudinary++; }
  else if (img.includes('unsplash.com')) { type = '🟡 UNSPLASH'; imgTypes.unsplash++; }
  else if (img.includes('pollinations.ai')) { type = '🐌 POLLINATIONS'; imgTypes.pollinations++; }
  else { type = '🔵 EXTERNAL'; imgTypes.other++; }

  console.log(`${type} | ${a.category?.padEnd(18)} | "${a.title?.slice(0, 50)}"`);
  console.log(`         ${img ? img.slice(0, 90) : '(sin imagen)'}`);
  console.log();
}

console.log('== RESUMEN ==');
console.log(`✅ Cloudinary:   ${imgTypes.cloudinary}`);
console.log(`🟡 Unsplash:     ${imgTypes.unsplash}`);
console.log(`🐌 Pollinations: ${imgTypes.pollinations}`);
console.log(`🔵 External:     ${imgTypes.other}`);
console.log(`🚫 Null/vacía:   ${imgTypes.null_empty}`);

// Mostrar duplicados
const dups = [...imgUrlCount.entries()].filter(([url, c]) => c > 1 && url);
if (dups.length > 0) {
  console.log(`\n== DUPLICADOS EN ESTOS 50 ==`);
  for (const [url, count] of dups) {
    console.log(`  x${count} — ${url.slice(0, 80)}`);
  }
}
