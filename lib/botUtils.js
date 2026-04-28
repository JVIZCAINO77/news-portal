
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
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.warn('[InternalizeImage] Missing Cloudinary config');
      return externalUrl;
    }

    const formData = new URLSearchParams();
    formData.append('file', externalUrl);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.warn('[InternalizeImage] Cloudinary upload failed:', errData.error?.message || response.statusText);
      return externalUrl;
    }

    const data = await response.json();
    
    // MEJORA PREMIUM: Añadir marca de agua/branding mediante transformaciones de Cloudinary
    // l_text:Montserrat_20_bold:IMPERIO%20PUBLICO: Texto overlay
    // co_white: Color blanco
    // g_south_east: Esquina inferior derecha
    // o_60: Opacidad al 60%
    const watermarkTransform = 'c_fill,g_auto,w_1200,h_675/l_text:Arial_30_bold:IMPERIO%20PÚBLICO,co_white,g_south_east,x_20,y_20,o_60';
    const brandedUrl = data.secure_url.replace('/upload/', `/upload/${watermarkTransform}/`);
    
    return brandedUrl;
  } catch (err) {
    console.error('[InternalizeImage] Error:', err.message);
    return externalUrl;
  }
}
