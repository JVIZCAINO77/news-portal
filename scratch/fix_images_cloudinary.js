/**
 * fix_images_cloudinary.js — Sube retroactivamente las imágenes externas a Cloudinary
 * y actualiza la base de datos con las nuevas URLs.
 *
 * Uso: node scratch/fix_images_cloudinary.js
 *
 * ⚠️  Ejecuta en lotes para no saturar la API de Cloudinary.
 *     Puedes interrumpir con Ctrl+C y volver a ejecutar — omite los ya corregidos.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
// Node 18+ tiene FormData y fetch nativos — no se necesita undici

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const CLOUD_NAME    = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').toLowerCase();
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const BATCH_SIZE    = 5;   // artículos procesados en paralelo
const TIMEOUT_MS    = 20000; // 20s por imagen

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Sube una URL de imagen externa a Cloudinary y devuelve la URL de Cloudinary.
 * @param {string} externalUrl
 * @returns {Promise<string|null>} URL de Cloudinary o null si falló
 */
async function uploadToCloudinary(externalUrl) {
  if (!externalUrl || externalUrl.includes('cloudinary.com')) return externalUrl;

  const formData = new FormData();
  formData.append('file', externalUrl);
  formData.append('upload_preset', UPLOAD_PRESET);

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData, signal: controller.signal }
    );

    if (!response.ok) {
      let errMsg = response.statusText;
      try { const e = await response.json(); errMsg = e.error?.message || errMsg; } catch {}
      console.warn(`    ⚠ Cloudinary rechazó (${response.status}): ${errMsg}`);
      return null;
    }

    const data = await response.json();
    if (!data.secure_url) return null;

    // Aplicar marca de agua + optimización igual que el bot
    const watermark = 'f_auto,q_auto,c_fill,g_auto,w_1200,h_675/l_text:Arial_30_bold:IMPERIO%20P%C3%9ABLICO,co_white,g_south_east,x_20,y_20,o_50';
    return data.secure_url.replace('/upload/', `/upload/${watermark}/`);

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`    ⏱ Timeout (${TIMEOUT_MS / 1000}s) para: ${externalUrl.slice(0, 60)}`);
    } else {
      console.warn(`    ✗ Error: ${err.message}`);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Procesa un artículo: sube imagen y actualiza Supabase.
 */
async function processArticle(article) {
  const shortTitle = (article.title || '').slice(0, 55);

  if (!article.image) {
    console.log(`  ⬜ Sin imagen: "${shortTitle}"`);
    return 'no_image';
  }

  if (article.image.includes('cloudinary.com')) {
    console.log(`  ✓  Ya en Cloudinary: "${shortTitle}"`);
    return 'already_done';
  }

  console.log(`  ↑  Subiendo: "${shortTitle}"`);
  console.log(`     URL: ${article.image.slice(0, 80)}`);

  const newUrl = await uploadToCloudinary(article.image);
  if (!newUrl) return 'failed';

  const { error } = await supabase
    .from('articles')
    .update({ image: newUrl, updated_at: new Date().toISOString() })
    .eq('id', article.id);

  if (error) {
    console.warn(`    ✗ Error actualizando BD: ${error.message}`);
    return 'failed';
  }

  console.log(`  ✅ Actualizado: "${shortTitle}"`);
  return 'fixed';
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FIX IMÁGENES — Migración masiva a Cloudinary');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    console.error('❌ ERROR: Faltan variables de entorno de Cloudinary.');
    console.error('   Verifica NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET');
    process.exit(1);
  }
  console.log(`☁  Cloudinary: ${CLOUD_NAME} / preset: ${UPLOAD_PRESET}\n`);

  // Traer TODOS los artículos con imagen que NO sea ya de Cloudinary
  let allArticles = [];
  let page = 0;
  const PAGE_SIZE = 100;

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, image')
      .not('image', 'ilike', '%cloudinary.com%')
      .order('publishedAt', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) { console.error('Error consultando BD:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;

    allArticles = [...allArticles, ...data];
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  const total = allArticles.length;
  console.log(`📋 Artículos a procesar: ${total}\n`);

  if (total === 0) {
    console.log('✅ Todos los artículos ya tienen imágenes de Cloudinary. ¡Nada que hacer!');
    return;
  }

  const stats = { fixed: 0, already_done: 0, no_image: 0, failed: 0 };

  // Procesar en lotes
  for (let i = 0; i < allArticles.length; i += BATCH_SIZE) {
    const batch = allArticles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allArticles.length / BATCH_SIZE);

    console.log(`\n─── Lote ${batchNum}/${totalBatches} ───────────────────────────────`);

    const results = await Promise.all(batch.map(processArticle));
    results.forEach(r => { if (stats[r] !== undefined) stats[r]++; });

    // Pequeña pausa entre lotes para respetar rate-limits de Cloudinary (free tier = 500 req/h)
    if (i + BATCH_SIZE < allArticles.length) {
      process.stdout.write('\n  ⏳ Pausa 2s...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      process.stdout.write(' OK\n');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Migrados a Cloudinary : ${stats.fixed}`);
  console.log(`  ✓  Ya estaban en Cloudinary: ${stats.already_done}`);
  console.log(`  ⬜ Sin imagen           : ${stats.no_image}`);
  console.log(`  ✗  Fallidos            : ${stats.failed}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (stats.failed > 0) {
    console.log(`⚠  ${stats.failed} imágenes no pudieron subirse. Vuelve a ejecutar el script`);
    console.log('   para reintentar — los ya migrados se saltan automáticamente.\n');
  }
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
