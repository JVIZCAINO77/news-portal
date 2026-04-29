/**
 * fix_images_fallback.js — Asigna imágenes de Unsplash (por categoría) a los
 * artículos que tienen imágenes rotas de pollinations.ai o que Cloudinary no pudo subir.
 *
 * Uso: node scratch/fix_images_fallback.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Imágenes de Unsplash curadas por categoría (mismas que PremiumImage.jsx para coherencia)
const FALLBACKS = {
  deportes:        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
  economia:        'https://images.unsplash.com/photo-1611974714851-eb60516746e3?q=80&w=1200&auto=format&fit=crop',
  internacional:   'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1200&auto=format&fit=crop',
  entretenimiento: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
  sucesos:         'https://images.unsplash.com/photo-1563206767-5b18f218e7de?q=80&w=1200&auto=format&fit=crop',
  tecnologia:      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1200&auto=format&fit=crop',
  salud:           'https://images.unsplash.com/photo-1505751172107-573225a91200?q=80&w=1200&auto=format&fit=crop',
  cultura:         'https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1200&auto=format&fit=crop',
  politica:        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1200&auto=format&fit=crop',
  opinion:         'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
  tendencias:      'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=1200&auto=format&fit=crop',
  noticias:        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop',
  default:         'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop',
};

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  FIX FALLBACK — Asignando imágenes Unsplash a artículos rotos');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Buscar artículos que aún tengan URLs externas (ni cloudinary ni unsplash)
  let allArticles = [];
  let page = 0;
  const PAGE_SIZE = 100;

  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, image, category')
      .not('image', 'ilike', '%cloudinary.com%')
      .not('image', 'ilike', '%unsplash.com%')
      .order('publishedAt', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) { console.error('Error consultando BD:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;

    allArticles = [...allArticles, ...data];
    if (data.length < PAGE_SIZE) break;
    page++;
  }

  const total = allArticles.length;
  console.log(`📋 Artículos con imagen rota o externa: ${total}\n`);

  if (total === 0) {
    console.log('✅ Todos los artículos tienen imágenes correctas. ¡Nada que hacer!\n');
    return;
  }

  let fixed = 0;
  let failed = 0;

  for (const article of allArticles) {
    const category   = (article.category || 'noticias').toLowerCase();
    const fallbackUrl = FALLBACKS[category] || FALLBACKS.default;
    const shortTitle  = (article.title || '').slice(0, 60);

    console.log(`  ↗ "${shortTitle}"`);
    console.log(`    Categoría: ${category} → usando Unsplash`);

    const { error } = await supabase
      .from('articles')
      .update({ image: fallbackUrl, updated_at: new Date().toISOString() })
      .eq('id', article.id);

    if (error) {
      console.warn(`    ✗ Error en BD: ${error.message}`);
      failed++;
    } else {
      console.log(`    ✅ OK`);
      fixed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  ✅ Corregidos con Unsplash : ${fixed}`);
  console.log(`  ✗  Errores de BD          : ${failed}`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(err => {
  console.error('\n❌ Error fatal:', err.message);
  process.exit(1);
});
