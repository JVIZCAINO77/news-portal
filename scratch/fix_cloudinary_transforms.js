/**
 * fix_cloudinary_transforms.js — Reemplaza el transform con marca de agua (lento)
 * por el transform simple (rápido) en todos los artículos de Cloudinary.
 *
 * Uso: node scratch/fix_cloudinary_transforms.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Transform lento (con marca de agua) → transform rápido
const OLD_TRANSFORMS = [
  'f_auto,q_auto,c_fill,g_auto,w_1200,h_675/l_text:Arial_30_bold:IMPERIO%20P%C3%9ABLICO,co_white,g_south_east,x_20,y_20,o_50',
  'f_auto,q_auto,c_fill,g_auto,w_1200,h_675/l_text:Arial_30_bold:IMPERIO%20PÚBLICO,co_white,g_south_east,x_20,y_20,o_60',
  'f_auto,q_auto,c_fill,g_auto,w_1200,h_675/l_text:Arial_30_bold:IMPERIO%20P%C3%9ABLICO,co_white,g_south_east,x_20,y_20,o_60',
];
const NEW_TRANSFORM = 'f_auto,q_auto,c_fill,g_auto,w_1200,h_675';

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FIX TRANSFORMS — Cloudinary: marca de agua → transform rápido');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Traer todos los artículos con imágenes de Cloudinary
  let allArticles = [];
  let page = 0;
  const PAGE_SIZE = 100;

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, image')
      .ilike('image', '%cloudinary.com%')
      .order('publishedAt', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) { console.error('Error BD:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    allArticles = [...allArticles, ...data];
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  console.log(`📋 Artículos con imagen en Cloudinary: ${allArticles.length}\n`);

  let fixed = 0;
  let skipped = 0;

  for (const article of allArticles) {
    const originalUrl = article.image;
    let newUrl = originalUrl;

    // Reemplazar cualquier variante del transform lento por el rápido
    for (const oldT of OLD_TRANSFORMS) {
      if (newUrl.includes(oldT)) {
        newUrl = newUrl.replace(oldT, NEW_TRANSFORM);
        break;
      }
    }

    // Si ya tiene el transform simple o no tiene ninguno de los lentos, saltar
    if (newUrl === originalUrl) {
      // Verificar si tiene algún transform de watermark aunque sea diferente
      if (originalUrl.includes('l_text:')) {
        // Tiene watermark pero no matcheó los patrones — lo limpiamos igual
        // Extraemos la URL base y aplicamos el transform simple
        const uploadIdx = originalUrl.indexOf('/upload/');
        if (uploadIdx !== -1) {
          // Encontrar donde empieza el ID de la imagen (después de todas las transformaciones)
          // El ID tiene el formato: v[timestamp]/[public_id].[ext]
          const vMatch = originalUrl.match(/\/v\d+\/[^/]+\.\w+$/);
          if (vMatch) {
            const base = originalUrl.substring(0, uploadIdx + '/upload/'.length);
            newUrl = `${base}${NEW_TRANSFORM}${vMatch[0]}`;
          }
        }
      }
    }

    if (newUrl === originalUrl) {
      skipped++;
      continue;
    }

    const shortTitle = (article.title || '').slice(0, 55);
    const { error: updateError } = await supabase
      .from('articles')
      .update({ image: newUrl, updated_at: new Date().toISOString() })
      .eq('id', article.id);

    if (updateError) {
      console.warn(`  ✗ Error en "${shortTitle}": ${updateError.message}`);
    } else {
      console.log(`  ✅ "${shortTitle}"`);
      fixed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESUMEN');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ URLs actualizadas (transform rápido) : ${fixed}`);
  console.log(`  ⏭  Ya tenían transform correcto        : ${skipped}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
