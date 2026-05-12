const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function internalizeImage(externalUrl) {
  if (!externalUrl || externalUrl.includes('cloudinary.com')) return externalUrl;
  
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  
  if (!cloudName || !uploadPreset) return externalUrl;

  try {
    const formData = new FormData();
    formData.append('file', externalUrl);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      return data.secure_url;
    }
  } catch (e) {
    console.error('Error internalizing:', externalUrl, e.message);
  }
  return externalUrl;
}

async function fix() {
  console.log('🚀 Iniciando reparación de artículos...');

  // 1. Obtener artículos con títulos sospechosos o imágenes externas
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, image, content, category')
    .order('publishedAt', { ascending: false });

  if (error) {
    console.error('Error fetching:', error);
    return;
  }

  console.log(`Analizando ${articles.length} artículos...`);

  for (const article of articles) {
    let needsUpdate = false;
    const updates = {};

    // --- LIMPIEZA DE TÍTULO ---
    if (article.title && (article.title.includes('\n') || article.title.includes('\\n'))) {
      console.log(`🧹 Limpiando título: "${article.title.replace(/\n/g, '[n]')}"`);
      updates.title = article.title.replace(/\\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
      needsUpdate = true;
    }

    // --- CASO ESPECÍFICO BUENOS AIRES ---
    if (article.title && article.title.toLowerCase().includes('buenos aires') && article.content.includes('Santo Domingo')) {
      console.log('🎯 Corrigiendo título "Buenos Aires" -> "Calidad del aire en Santo Domingo"');
      updates.title = "Alarma en Santo Domingo por el peligroso deterioro de la calidad del aire";
      needsUpdate = true;
    }

    // --- INTERNALIZACIÓN DE IMAGEN ---
    if (article.image && !article.image.includes('cloudinary.com') && !article.image.includes('unsplash.com')) {
      console.log(`🖼️  Internalizando imagen externa: ${article.image.slice(0, 50)}...`);
      const newImage = await internalizeImage(article.image);
      if (newImage !== article.image) {
        updates.image = newImage;
        needsUpdate = true;
        console.log(`✅ Nueva imagen: ${newImage}`);
      }
    }

    if (needsUpdate) {
      const { error: upError } = await supabase
        .from('articles')
        .update(updates)
        .eq('id', article.id);
      
      if (upError) console.error(`❌ Error actualizando ${article.id}:`, upError);
      else console.log(`✨ Artículo ${article.id} reparado.`);
    }
  }

  console.log('✅ Reparación finalizada.');
}

fix();
