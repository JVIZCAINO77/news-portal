// lib/cloudinary.js
// Subida de imágenes a Cloudinary usando unsigned upload preset
// No requiere SDK — usa la API REST directamente desde el browser

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'DKKW77byz';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'news_portal';

/**
 * Sube un archivo de imagen a Cloudinary y retorna la URL pública optimizada.
 * @param {File} file - Archivo de imagen seleccionado por el usuario
 * @param {object} options - Opciones adicionales (folder, etc.)
 * @returns {Promise<string>} URL pública de la imagen en Cloudinary
 */
export async function uploadImageToCloudinary(file, options = {}) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary no está configurado. Agrega NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET al .env.local');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', options.folder || 'news-portal/articles');

  // Transformaciones automáticas: máx 1200px de ancho, calidad auto, formato WebP
  formData.append('transformation', 'w_1200,q_auto,f_webp');

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Error al subir imagen a Cloudinary');
  }

  const data = await response.json();

  // Retornamos la URL con transformaciones automáticas aplicadas
  // f_auto: formato óptimo según el navegador (WebP, AVIF, etc.)
  // q_auto: calidad óptima automática
  // w_1200: máximo 1200px de ancho
  return data.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1200/');
}

/**
 * Genera una URL de Cloudinary con transformaciones específicas.
 * Útil para thumbnails, hero images, etc.
 */
export function getCloudinaryUrl(publicId, transforms = 'f_auto,q_auto,w_800') {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}
