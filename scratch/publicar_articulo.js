/**
 * Script de publicación de artículos — Imperio Público
 * Uso: node scratch/publicar_articulo.js
 * 
 * Siempre sube la imagen a Cloudinary antes de insertar en Supabase.
 * Coloca la imagen en: public/images/news/<nombre>.jpg|png
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// ─────────────────────────────────────────────────
// 📝 CONFIGURA AQUÍ EL ARTÍCULO
// ─────────────────────────────────────────────────
const ARTICULO = {
  title: '',       // Título del artículo
  excerpt: '',     // Bajada / resumen
  content: ``,    // Cuerpo en Markdown
  category: 'noticias', // Ver categorías en lib/data.js
  imagenLocal: '', // Ruta relativa desde /public, ej: 'images/news/mi-foto.jpg'
  author: 'Redacción Imperio Público',
  tags: [],        // Ej: ['Politica', 'RD']
  featured: false,
  trending: false,
};
// ─────────────────────────────────────────────────

async function uploadImageToCloudinary(imagenLocal) {
  const imagePath = path.join(__dirname, '../public', imagenLocal);

  if (!fs.existsSync(imagePath)) {
    throw new Error(`❌ Imagen no encontrada: ${imagePath}`);
  }

  console.log('📤 Subiendo imagen a Cloudinary...');
  const fileBuffer = fs.readFileSync(imagePath);
  const ext = path.extname(imagenLocal).slice(1) || 'jpeg';
  const blob = new Blob([fileBuffer], { type: `image/${ext}` });

  const formData = new FormData();
  formData.append('file', blob, path.basename(imagenLocal));
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(`Cloudinary: ${data?.error?.message}`);

  console.log('✅ Imagen en Cloudinary:', data.secure_url);
  return data.secure_url;
}

async function publicar() {
  const { title, excerpt, content, category, imagenLocal, author, tags, featured, trending } = ARTICULO;

  if (!title || !excerpt || !content) {
    console.error('❌ Faltan campos obligatorios: title, excerpt, content');
    process.exit(1);
  }

  // 1. Subir imagen a Cloudinary si hay una local
  let imageUrl = '';
  if (imagenLocal) {
    imageUrl = await uploadImageToCloudinary(imagenLocal);
  } else {
    console.warn('⚠️  No se especificó imagen local. Usando imagen por defecto.');
    imageUrl = 'https://images.unsplash.com/photo-1504711331083-9c897949ff59?auto=format&fit=crop&w=1200&h=630&q=80';
  }

  // 2. Generar slug
  const slug = title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  // 3. Verificar duplicado
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    console.error('⚠️  Ya existe un artículo con este slug:', slug);
    process.exit(1);
  }

  // 4. Insertar en Supabase
  const newArticle = {
    title,
    slug,
    excerpt,
    content,
    category,
    image: imageUrl,
    author,
    tags: tags.length ? tags : null,
    publishedAt: new Date().toISOString(),
    featured,
    trending,
  };

  const { data, error } = await supabase.from('articles').insert(newArticle).select('id, slug');

  if (error) {
    console.error('❌ Error al publicar:', error.message);
  } else {
    console.log('🚀 Artículo publicado con éxito:', data);
  }
}

publicar();
