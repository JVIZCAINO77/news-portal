
/**
 * Internaliza una imagen externa subiéndola a Cloudinary.
 * Esto evita problemas de hotlinking y asegura que las imágenes siempre carguen.
 * @param {string} externalUrl - La URL de la imagen externa
 * @returns {Promise<string>} - La nueva URL de Cloudinary o la original si falla
 */
export async function internalizeImage(externalUrl) {
  if (!externalUrl || externalUrl.includes('cloudinary.com') || externalUrl.includes('pollinations.ai')) {
    return externalUrl;
  }

  try {
    // Cloudinary cloud name debe estar en minúsculas
    const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').toLowerCase();
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.warn('[InternalizeImage] Missing Cloudinary config — se usará URL externa');
      return externalUrl;
    }

    // ✅ FIX CRÍTICO: Cloudinary requiere multipart/form-data, NO application/x-www-form-urlencoded
    // El uso anterior de URLSearchParams causaba que TODOS los uploads fallaran silenciosamente
    const formData = new FormData();
    formData.append('file', externalUrl);       // URL remota a subir
    formData.append('upload_preset', uploadPreset);

    // Timeout de 15s para no bloquear el bot
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let errMsg = response.statusText;
      try {
        const errData = await response.json();
        errMsg = errData.error?.message || errMsg;
      } catch { /* ignorar si el cuerpo no es JSON */ }
      console.warn(`[InternalizeImage] Cloudinary rechazó el upload (${response.status}): ${errMsg}`);
      return externalUrl;
    }

    const data = await response.json();

    if (!data.secure_url) {
      console.warn('[InternalizeImage] Cloudinary no devolvió secure_url');
      return externalUrl;
    }

    console.log(`[InternalizeImage] ✅ Imagen subida a Cloudinary: ${data.secure_url.slice(0, 60)}...`);

    // Marca de agua de branding (solo texto sutil en esquina inferior derecha)
    // Transformación simple y rápida — sin l_text overlay que ralentizaba la primera carga
    const fastTransform = 'f_auto,q_auto,c_fill,g_auto,w_1200,h_675';
    const brandedUrl = data.secure_url.replace('/upload/', `/upload/${fastTransform}/`);

    return brandedUrl;
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn('[InternalizeImage] Timeout (15s) — se usará URL externa como fallback');
    } else {
      console.error('[InternalizeImage] Error inesperado:', err.message);
    }
    return externalUrl;
  }
}
