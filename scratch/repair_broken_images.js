/**
 * repair_broken_images.js
 * Repara artículos con imágenes rotas de Pollinations.ai → Unsplash permanente.
 * Uso: node scratch/repair_broken_images.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Imágenes permanentes de Unsplash por categoría (siempre disponibles)
const CATEGORY_IMAGES = {
  deportes:        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
  economia:        'https://images.unsplash.com/photo-1611974714851-eb60516746e3?q=80&w=1200&auto=format&fit=crop',
  internacional:   'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1200&auto=format&fit=crop',
  entretenimiento: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
  sucesos:         'https://images.unsplash.com/photo-1563206767-5b18f218e7de?q=80&w=1200&auto=format&fit=crop',
  tecnologia:      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1200&auto=format&fit=crop',
  salud:           'https://images.unsplash.com/photo-1505751172107-573225a91200?q=80&w=1200&auto=format&fit=crop',
  cultura:         'https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1200&auto=format&fit=crop',
  politica:        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1200&auto=format&fit=crop',
  noticias:        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop',
  tendencias:      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1200&auto=format&fit=crop',
  policia:         'https://images.unsplash.com/photo-1589391886645-d51941baf7fb?q=80&w=1200&auto=format&fit=crop',
  default:         'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop',
};

function getFallback(category) {
  return CATEGORY_IMAGES[(category || '').toLowerCase()] || CATEGORY_IMAGES.default;
}

// Verifica si una URL de imagen está accesible
async function isImageAccessible(url) {
  if (!url) return false;
  // Cloudinary y Unsplash siempre están OK
  if (url.includes('cloudinary.com') || url.includes('unsplash.com')) return true;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🔍 Buscando artículos con imágenes rotas...\n');

  // Obtener todos los artículos (en lotes de 1000)
  let allArticles = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, image, category')
      .range(from, from + batchSize - 1)
      .order('publishedAt', { ascending: false });
    
    if (error) { console.error('Error BD:', error.message); break; }
    if (!data || data.length === 0) break;
    allArticles.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  console.log(`📚 Total de artículos: ${allArticles.length}`);

  // Identificar los que tienen imágenes de Pollinations (siempre rotas)
  const brokenByPollinations = allArticles.filter(a => 
    a.image && a.image.includes('pollinations.ai')
  );
  
  // También los que no tienen imagen
  const noImage = allArticles.filter(a => !a.image);
  
  console.log(`❌ Con imagen de Pollinations (siempre rotas): ${brokenByPollinations.length}`);
  console.log(`⚠️  Sin imagen: ${noImage.length}`);
  console.log(`\n🔧 Reparando...\n`);

  const toRepair = [...brokenByPollinations, ...noImage];
  let fixed = 0;
  let errors = 0;

  for (const article of toRepair) {
    const newImage = getFallback(article.category);
    
    const { error } = await supabase
      .from('articles')
      .update({ image: newImage, imageAlt: article.title || 'Imagen de noticia' })
      .eq('id', article.id);
    
    if (error) {
      console.log(`  ❌ Error actualizando "${article.title?.slice(0, 50)}": ${error.message}`);
      errors++;
    } else {
      console.log(`  ✅ [${article.category?.toUpperCase()}] "${article.title?.slice(0, 55)}"`);
      fixed++;
    }
    
    // Pausa pequeña para no saturar la API
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`\n══════════════════════════════════════`);
  console.log(`✅ Reparados: ${fixed}`);
  console.log(`❌ Errores:   ${errors}`);
  console.log(`══════════════════════════════════════`);
  console.log('\n⚡ Listo. Las imágenes se mostrarán en el portal inmediatamente.');
  console.log('💡 Los artículos nuevos usarán Cloudinary automáticamente.');
}

main().catch(console.error);
