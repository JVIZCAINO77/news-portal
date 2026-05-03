/**
 * Utilidad premium para subir archivos a Cloudinary
 * @param {File|Blob} file - El archivo a subir
 * @returns {Promise<string>} - La URL segura de la imagen
 */
export async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

  // Timeout de 30s para evitar que la UI quede bloqueada si Cloudinary no responde
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Error HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Tiempo de espera agotado al subir imagen. Intenta de nuevo.');
    }
    throw err;
  }
}
