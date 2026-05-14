/**
 * scratch/test_social_improved.js
 * Prueba el sistema de auto-post mejorado (thumbnails + descripciones)
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Traer el artículo más reciente con imagen de Cloudinary
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, category, image')
    .like('image', '%cloudinary%')
    .order('publishedAt', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('❌ No se encontró artículo:', error?.message);
    return;
  }

  console.log('📰 Artículo:', data.title);
  console.log('📂 Categoría:', data.category);
  console.log('🖼️  Imagen:', data.image?.slice(0, 70) + '...');
  console.log('🔗 URL: https://imperiopublico.com/articulo/' + data.slug);
  console.log('');

  // Importar social.js (ESM) dinámicamente
  const { postToSocialMedia } = await import('../lib/social.js');
  await postToSocialMedia(data);

  console.log('\n✅ Proceso completado.');
}

main().catch(console.error);
