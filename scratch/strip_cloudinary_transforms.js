/**
 * strip_cloudinary_transforms.js — Limpia todas las URLs de Cloudinary en la BD,
 * dejando solo la URL base sin transforms (los transforms se aplican en el frontend).
 * Uso: node scratch/strip_cloudinary_transforms.js
 */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function stripTransforms(url) {
  if (!url || !url.includes('cloudinary.com') || !url.includes('/upload/')) return null;
  // La URL base de Cloudinary tiene la forma:
  // https://res.cloudinary.com/{cloud}/image/upload/{transforms}/{version}/{public_id}
  // Queremos dejar solo: https://res.cloudinary.com/{cloud}/image/upload/{version}/{public_id}
  const uploadIdx = url.indexOf('/upload/');
  const afterUpload = url.slice(uploadIdx + '/upload/'.length);
  // Si empieza por 'v' seguido de dígitos, ya está limpia
  if (/^v\d+\//.test(afterUpload)) return null; // ya limpia
  // Buscar el inicio del version token (v{digits}/) en el resto del path
  const vMatch = afterUpload.match(/v\d+\/.+/);
  if (!vMatch) return null; // no podemos limpiar
  const base = url.slice(0, uploadIdx + '/upload/'.length);
  return base + vMatch[0];
}

async function main() {
  console.log('═════════════════════════════════════════════════════');
  console.log('  STRIP TRANSFORMS — Limpiando URLs de Cloudinary');
  console.log('═════════════════════════════════════════════════════\n');

  let allArticles = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('articles').select('id, title, image')
      .ilike('image', '%cloudinary.com%')
      .order('publishedAt', { ascending: false })
      .range(page * 100, (page + 1) * 100 - 1);
    if (error) { console.error('Error BD:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    allArticles = [...allArticles, ...data];
    if (data.length < 100) break;
    page++;
  }

  console.log(`📋 Artículos con imagen en Cloudinary: ${allArticles.length}\n`);
  let fixed = 0, skipped = 0, failed = 0;

  for (const article of allArticles) {
    const cleanUrl = stripTransforms(article.image);
    if (!cleanUrl) { skipped++; continue; }

    const { error } = await supabase.from('articles')
      .update({ image: cleanUrl, updated_at: new Date().toISOString() })
      .eq('id', article.id);

    if (error) { console.warn(`  ✗ "${(article.title||'').slice(0,50)}": ${error.message}`); failed++; }
    else { console.log(`  ✅ "${(article.title||'').slice(0,55)}"`); fixed++; }
  }

  console.log('\n═════════════════════════════════════════════════════');
  console.log(`  ✅ URLs limpiadas : ${fixed}`);
  console.log(`  ⏭  Ya limpias    : ${skipped}`);
  console.log(`  ✗  Errores       : ${failed}`);
  console.log('═════════════════════════════════════════════════════\n');
}
main().catch(err => { console.error('Error:', err.message); process.exit(1); });
