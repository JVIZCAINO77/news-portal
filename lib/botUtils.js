/**
 * botUtils.js — Utilidades del Bot de Imperio Público
 *
 * internalizeImage (REFORZADO):
 *   GARANTÍA: Siempre devuelve una URL de Cloudinary o null si es imposible.
 *   Nunca deja pasar una URL externa sin internalizar.
 *
 *   1. Si ya es Cloudinary → devuelve tal cual.
 *   2. Dominio en blocklist → salta directamente a null (se generará imagen de IA).
 *   3. Intenta subir a Cloudinary con hasta 3 reintentos y backoff exponencial.
 *   4. Si falla definitivamente → devuelve null (el bot generará imagen de IA y reintentará).
 */

// Dominios conocidos que bloquean hotlinking — saltamos directamente a imagen de IA
const IMAGE_BLOCKED_DOMAINS = new Set([
  'diariolibre.com',
  'listindiario.com',
  'eldinero.com.do',
  'elcaribe.com.do',
  'elnacional.com.do',
  'hoy.com.do',
  'acento.com.do',
  'ndigital.do',
  'n.com.do',
  'noticiassin.com',
  'cdn.com.do',
  'eldia.com.do',
  'almomento.net',
  'remolacha.net',
  'almamanews.com',
  'primerahora.com',
  'elnuevodia.com',
  'pericoenlared.com',
  'z101digital.com',
]);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Intenta subir una URL a Cloudinary.
 * Retorna la URL de Cloudinary en éxito, o null en fallo.
 * NO hace retry — los reintentos los maneja internalizeImage.
 */
async function uploadToCloudinary(safeUrl, cloudName, apiKey, apiSecret, uploadPreset, timeoutMs = 30000) {
  try {
    const formData = new FormData();
    formData.append('file', safeUrl);

    if (uploadPreset) {
      formData.append('upload_preset', uploadPreset);
    } else {
      const timestamp = Math.round(Date.now() / 1000);
      const crypto = await import('crypto');
      const signature = crypto
        .createHash('sha1')
        .update(`timestamp=${timestamp}${apiSecret}`)
        .digest('hex');
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData, signal: AbortSignal.timeout(timeoutMs) }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error?.message || response.statusText;
      console.warn(`[InternalizeImage] ❌ Cloudinary rechazó (${response.status}): ${msg}`);
      return null;
    }

    const data = await response.json();
    if (!data.secure_url) return null;

    console.log(`[InternalizeImage] ✅ Cloudinary: ${data.secure_url.slice(0, 70)}...`);
    return data.secure_url;
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      console.warn(`[InternalizeImage] ⏱ Timeout (${timeoutMs}ms) al subir a Cloudinary`);
    } else {
      console.warn(`[InternalizeImage] Error upload: ${err.message}`);
    }
    return null;
  }
}

/**
 * internalizeImage — VERSIÓN REFORZADA con 3 reintentos y backoff exponencial.
 *
 * @param {string} externalUrl  URL de imagen a internalizar
 * @param {number} [maxAttempts=3]  Número máximo de intentos (default: 3)
 * @returns {Promise<string|null>} URL de Cloudinary o null si es imposible
 */
export async function internalizeImage(externalUrl, maxAttempts = 3) {
  // ── Guarda 1: URL vacía o ya es Cloudinary ──────────────────────────────────
  if (!externalUrl) return null;
  if (externalUrl.includes('cloudinary.com')) return externalUrl;

  // ── Guarda 2: Configuración de Cloudinary disponible ───────────────────────────────────
  // CLOUDINARY_CLOUD_NAME = server-side (bot, API routes)
  // NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = client + server (fallback cuando la primera no está)
  const cloudName    = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey       = process.env.CLOUDINARY_API_KEY;
  const apiSecret    = process.env.CLOUDINARY_API_SECRET;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || (!uploadPreset && (!apiKey || !apiSecret))) {
    console.error('[InternalizeImage] ❌ CRÍTICO: Variables de Cloudinary no configuradas.');
    return null;
  }

  // ── Guarda 3: Normalizar y validar URL ──────────────────────────────────────
  let safeUrl = externalUrl;
  if (safeUrl.startsWith('//'))    safeUrl = `https:${safeUrl}`;
  if (safeUrl.startsWith('http:')) safeUrl = safeUrl.replace('http://', 'https://');

  // Validar que sea una URL válida antes de desperdiciar un intento
  try { new URL(safeUrl); } catch { console.warn(`[InternalizeImage] URL inválida: ${safeUrl.slice(0,60)}`); return null; }

  // ── Guarda 4: Dominio en blocklist → saltar inmediatamente ─────────────────
  try {
    const domain = new URL(safeUrl).hostname.replace('www.', '');
    if (IMAGE_BLOCKED_DOMAINS.has(domain) || [...IMAGE_BLOCKED_DOMAINS].some(d => domain.endsWith('.' + d))) {
      console.log(`[InternalizeImage] 🚫 Dominio bloqueado (${domain}) — usando imagen de IA`);
      return null;
    }
  } catch {
    return null;
  }

  // ── Intentos con backoff exponencial ────────────────────────────────────────────
  // Timeouts reducidos al contexto real del bot (55s total en Vercel):
  //   Intento 1:  12s timeout, 0s espera   (total: 12s)
  //   Intento 2:  15s timeout, 2s espera   (total: 29s)
  //   Intento 3:  18s timeout, 3s espera   (total: 50s) ← llega justo al límite
  // Con el tiempo que ya usó el bot antes de llegar aquí (~5-15s) en la práctica
  // solo se ejecutan 1-2 reintentos. El 3º es un seguro de último recurso.
  const timeouts = [12000, 15000, 18000];
  const waits    = [0, 2000, 3000];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (waits[attempt - 1] > 0) {
      console.log(`[InternalizeImage] 🔄 Reintento ${attempt}/${maxAttempts} en ${waits[attempt - 1] / 1000}s...`);
      await sleep(waits[attempt - 1]);
    }

    const result = await uploadToCloudinary(
      safeUrl, cloudName, apiKey, apiSecret, uploadPreset,
      timeouts[attempt - 1]
    );

    if (result) return result; // ✅ Éxito
  }

  console.warn(`[InternalizeImage] 🚨 Agotados ${maxAttempts} intentos para: ${safeUrl.slice(0, 60)}`);
  return null;
}
