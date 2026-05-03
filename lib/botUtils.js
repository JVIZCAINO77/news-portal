/**
 * botUtils.js — Utilidades del Bot de Imperio Público
 *
 * internalizeImage:
 *   1. Si ya es Cloudinary → la devuelve tal cual.
 *   2. Intenta subir via Cloudinary Fetch (CDN proxy) — rápido, sin descargar nada.
 *   3. Si ese dominio bloquea → devuelve null.
 *   El bot usará imagen generada por IA como fallback cuando retorna null.
 */

// Dominios conocidos que bloquean hotlinking — saltamos directamente a imagen de IA
const IMAGE_BLOCKED_DOMAINS = new Set([
  'diariolibre.com',
  'listindiario.com',
  'eldinero.com.do',
  'elcaribe.com.do',
]);

export async function internalizeImage(externalUrl) {
  if (!externalUrl || externalUrl.includes('cloudinary.com')) {
    return externalUrl;
  }

  const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').toLowerCase();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return null;
  }

  // Normalizar URL
  let safeUrl = externalUrl;
  if (safeUrl.startsWith('//')) safeUrl = `https:${safeUrl}`;
  if (safeUrl.startsWith('http://')) safeUrl = safeUrl.replace('http://', 'https://');

  // Verificar si el dominio está en la blocklist — saltar inmediatamente
  try {
    const domain = new URL(safeUrl).hostname.replace('www.', '');
    if (IMAGE_BLOCKED_DOMAINS.has(domain)) {
      console.log(`[InternalizeImage] 🚫 Dominio bloqueado (${domain}) — usando imagen de IA`);
      return null;
    }
  } catch (_) {
    return null;
  }

  // Intentar subir via Cloudinary (con timeout corto de 10s para no frenar el bot)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const formData = new FormData();
    formData.append('file', safeUrl);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData, signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData.error?.message || response.statusText;
      console.warn(`[InternalizeImage] ❌ Cloudinary rechazó (${response.status}): ${msg} — usando IA`);
      return null;
    }

    const data = await response.json();
    if (!data.secure_url) return null;

    console.log(`[InternalizeImage] ✅ Subida a Cloudinary: ${data.secure_url.slice(0, 60)}...`);
    return data.secure_url;

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn('[InternalizeImage] ⏱ Timeout — usando imagen de IA');
    } else {
      console.warn('[InternalizeImage] Error:', err.message, '— usando imagen de IA');
    }
    return null;
  }
}
