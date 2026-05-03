
/**
 * botUtils.js — Utilidades del Bot de Imperio Público
 * 
 * internalizeImage: Convierte cualquier URL de imagen externa a una URL de Cloudinary.
 * Usa la estrategia más robusta disponible en cascada:
 *   1. Cloudinary Fetch (modo CDN proxy) — sin necesidad de descargar la imagen
 *   2. Upload directo a Cloudinary (fallback si el sitio bloquea Cloudinary Fetch)
 *   3. URL original (último recurso)
 */
export async function internalizeImage(externalUrl) {
  // Ya está en Cloudinary — no necesita re-subirse
  if (!externalUrl || externalUrl.includes('cloudinary.com')) {
    return externalUrl;
  }

  const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').toLowerCase();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.warn('[InternalizeImage] Missing Cloudinary config — se usará URL externa');
    return externalUrl;
  }

  // Normalizar URL
  let safeUrl = externalUrl;
  if (safeUrl.startsWith('//')) safeUrl = `https:${safeUrl}`;
  if (safeUrl.startsWith('http://')) safeUrl = safeUrl.replace('http://', 'https://');

  // ─── ESTRATEGIA 1: Cloudinary Fetch URL ─────────────────────────────────────
  // Cloudinary actúa como CDN proxy: descarga la imagen desde sus propios servidores
  // (con su propio pool de IPs) y la cachea. No consume ancho de banda de nuestro servidor.
  // Ventaja: bypassa el hotlink protection porque Cloudinary parece un browser real.
  try {
    const fetchTransforms = 'f_auto,q_auto:good,c_limit,w_1280';
    const cloudinaryFetchUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/${fetchTransforms}/${encodeURIComponent(safeUrl)}`;

    // Verificamos que Cloudinary puede acceder a la imagen (HEAD request)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const testRes = await fetch(cloudinaryFetchUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (testRes.ok) {
        console.log(`[InternalizeImage] ✅ Cloudinary Fetch OK: ${cloudinaryFetchUrl.slice(0, 80)}...`);
        // Retornamos la URL de Cloudinary fetch directamente — ya optimizada con f_auto,q_auto
        // La guardamos sin los transforms para que optimizeImageUrl los aplique después
        return `https://res.cloudinary.com/${cloudName}/image/fetch/${encodeURIComponent(safeUrl)}`;
      }
      console.warn(`[InternalizeImage] Cloudinary Fetch rechazado (${testRes.status}) — intentando upload directo`);
    } catch (headErr) {
      clearTimeout(timeoutId);
      console.warn('[InternalizeImage] Cloudinary Fetch HEAD timeout — intentando upload directo');
    }
  } catch (fetchErr) {
    console.warn('[InternalizeImage] Cloudinary Fetch falló:', fetchErr.message);
  }

  // ─── ESTRATEGIA 2: Upload directo a Cloudinary ──────────────────────────────
  // Primero intentamos descargar la imagen con headers de navegador completos,
  // luego la subimos como blob a Cloudinary.
  try {
    const imgController = new AbortController();
    const imgTimeout = setTimeout(() => imgController.abort(), 12000);

    let imageBlob = null;
    try {
      const imgRes = await fetch(safeUrl, {
        signal: imgController.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'es-DO,es;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': new URL(safeUrl).origin + '/',
          'sec-fetch-dest': 'image',
          'sec-fetch-mode': 'no-cors',
          'sec-fetch-site': 'same-site',
        },
        redirect: 'follow',
      });
      clearTimeout(imgTimeout);

      if (imgRes.ok) {
        imageBlob = await imgRes.blob();
      } else {
        console.warn(`[InternalizeImage] No se pudo descargar imagen (${imgRes.status}), intentando con URL directa a Cloudinary`);
      }
    } catch (dlErr) {
      clearTimeout(imgTimeout);
      console.warn('[InternalizeImage] Error descargando imagen:', dlErr.message);
    }

    // Si conseguimos el blob, lo subimos
    if (imageBlob && imageBlob.size > 1000) {
      const formData = new FormData();
      formData.append('file', imageBlob, 'image.jpg');
      formData.append('upload_preset', uploadPreset);

      const uploadController = new AbortController();
      const uploadTimeout = setTimeout(() => uploadController.abort(), 20000);

      try {
        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: 'POST', body: formData, signal: uploadController.signal }
        );
        clearTimeout(uploadTimeout);

        if (uploadRes.ok) {
          const data = await uploadRes.json();
          if (data.secure_url) {
            console.log(`[InternalizeImage] ✅ Upload exitoso: ${data.secure_url.slice(0, 60)}...`);
            return data.secure_url;
          }
        }
      } catch (uploadErr) {
        clearTimeout(uploadTimeout);
        console.warn('[InternalizeImage] Upload Cloudinary falló:', uploadErr.message);
      }
    }

    // Intentar con URL directa (sin descargar el blob)
    const formData = new FormData();
    formData.append('file', safeUrl);
    formData.append('upload_preset', uploadPreset);

    const directController = new AbortController();
    const directTimeout = setTimeout(() => directController.abort(), 15000);

    try {
      const directRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData, signal: directController.signal }
      );
      clearTimeout(directTimeout);

      if (directRes.ok) {
        const data = await directRes.json();
        if (data.secure_url) {
          console.log(`[InternalizeImage] ✅ Upload directo exitoso: ${data.secure_url.slice(0, 60)}...`);
          return data.secure_url;
        }
      }
    } catch (directErr) {
      clearTimeout(directTimeout);
    }

  } catch (err) {
    console.error('[InternalizeImage] Error en estrategia 2:', err.message);
  }

  // ─── ESTRATEGIA 3: Fallback — URL original ───────────────────────────────────
  // El proxy de imágenes del portal (/api/proxy-image) se encargará de servirla.
  console.warn(`[InternalizeImage] ⚠️ Todas las estrategias fallaron — usando URL original como respaldo: ${safeUrl.slice(0, 60)}`);
  return safeUrl;
}
