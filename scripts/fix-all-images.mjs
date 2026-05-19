/**
 * fix-all-images.mjs
 * Audita TODOS los artículos en Supabase y repara imágenes:
 *  - NULL / vacías
 *  - Pollinations AI (lentas, generan duplicados visuales)
 *  - Dominios que bloquean hotlinking (diariolibre, listindiario, etc.)
 *  - URLs que devuelven error HTTP
 *  - Imágenes duplicadas (misma URL en varios artículos)
 *
 * Para cada imagen problemática:
 *  1. Genera imagen editorial única con Pollinations AI (prompt con título+categoría)
 *  2. La sube a Cloudinary (CDN rápido, sin hotlink)
 *  3. Actualiza el campo `image` en Supabase
 *
 * Uso: node scripts/fix-all-images.mjs
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://vprjbntwebhzjjcnlztc.supabase.co';
const SUPABASE_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmpibnR3ZWJoempqY25senRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA4OTMwNSwiZXhwIjoyMDkwNjY1MzA1fQ.zdwco4O57L2X2xzuj0H28plAxWqRF6vwYJIl9qGLhGM';
const CLOUD_NAME       = 'dkkw77byz';
const CLOUD_API_KEY    = '293867698721174';
const CLOUD_API_SECRET = 'rAfhniOqMOXNHWCadSveV32zWl0';

// Dominios que bloquean hotlink → necesitan reemplazo
const BLOCKED_DOMAINS = new Set([
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
  'diariodominicanotoday.com',
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function isBlockedDomain(url) {
  if (!url) return false;
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return BLOCKED_DOMAINS.has(domain) || [...BLOCKED_DOMAINS].some(d => domain.endsWith('.' + d));
  } catch { return false; }
}

function isPollinationsUrl(url) {
  return url && (url.includes('pollinations.ai') || url.includes('image.pollinations'));
}

function isCloudinaryUrl(url) {
  return url && url.includes('cloudinary.com');
}

function isUnsplashUrl(url) {
  return url && url.includes('unsplash.com');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Genera URL de Pollinations AI con prompt editorial único basado en título + categoría
 */
function buildPollinationsUrl(title, category) {
  const seed = Date.now() + Math.floor(Math.random() * 99999);
  const prompt = `high-end editorial news photography for article: "${title.slice(0, 120)}". Category: ${category}. Professional journalistic style, cinematic lighting, photorealistic, 16:9 aspect ratio. NO TEXT, NO LETTERS, NO LOGOS.`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${seed}`;
}

/**
 * Sube una URL de imagen a Cloudinary via Upload API
 * Retorna la URL de Cloudinary o null si falla
 */
async function uploadToCloudinary(imageUrl, folder = 'imperio-publico/fixed') {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + CLOUD_API_SECRET)
      .digest('hex');

    const formData = new FormData();
    formData.append('file', imageUrl);
    formData.append('folder', folder);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', CLOUD_API_KEY);
    formData.append('signature', signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData, signal: AbortSignal.timeout(60000) }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log(`    ⚠️  Cloudinary rechazó: ${err.error?.message || res.status}`);
      return null;
    }

    const data = await res.json();
    return data.secure_url || null;
  } catch (e) {
    console.log(`    ⚠️  Error Cloudinary: ${e.message?.slice(0, 60)}`);
    return null;
  }
}

/**
 * Verifica si una URL de imagen responde correctamente (HTTP 200 + content-type image/*)
 * Usa HEAD request para no descargar la imagen completa
 */
async function isImageAccessible(url) {
  if (!url) return false;
  // Cloudinary y Unsplash siempre son accesibles
  if (isCloudinaryUrl(url) || isUnsplashUrl(url)) return true;
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
        'Referer': 'https://imperiopublico.com/',
      },
      signal: AbortSignal.timeout(8000),
      redirect: 'follow',
    });
    if (!res.ok) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('image/') || ct.includes('octet-stream');
  } catch {
    return false;
  }
}

/**
 * Genera una imagen nueva y la sube a Cloudinary.
 * Primero intenta con la URL de Pollinations (con retry).
 * Retorna la URL de Cloudinary o null.
 */
async function generateAndUpload(title, category) {
  // 2 intentos con diferentes seeds
  for (let attempt = 1; attempt <= 2; attempt++) {
    const polUrl = buildPollinationsUrl(title, category);
    console.log(`    🎨 Generando imagen (intento ${attempt}): ${polUrl.slice(0, 80)}...`);
    
    // Esperar a que Pollinations genere la imagen (puede tardar hasta 30s)
    await sleep(3000);
    
    const cloudUrl = await uploadToCloudinary(polUrl);
    if (cloudUrl) {
      console.log(`    ✅ Cloudinary: ${cloudUrl.slice(0, 70)}...`);
      return cloudUrl;
    }
    
    // Esperar antes del retry
    await sleep(5000);
  }
  
  console.log(`    ❌ No se pudo generar imagen para: "${title.slice(0, 50)}"`);
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('🔍 Cargando todos los artículos de Supabase...\n');

  // Cargar todos los artículos (solo campos necesarios)
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, category, image, slug')
    .order('publishedAt', { ascending: false });

  if (error) {
    console.error('❌ Error cargando artículos:', error.message);
    process.exit(1);
  }

  console.log(`📋 Total de artículos: ${articles.length}\n`);

  // ── FASE 1: Clasificar artículos por tipo de problema ──────────────────────
  const needsFix = [];
  const imageUrlCount = new Map(); // para detectar duplicados

  // Contar cuántas veces aparece cada URL de imagen
  for (const art of articles) {
    if (art.image) {
      imageUrlCount.set(art.image, (imageUrlCount.get(art.image) || 0) + 1);
    }
  }

  console.log('🔎 Clasificando artículos...\n');

  let checked = 0;
  for (const art of articles) {
    checked++;
    const img = art.image;
    let reason = null;

    if (!img || img.trim() === '') {
      reason = 'SIN_IMAGEN';
    } else if (isPollinationsUrl(img)) {
      reason = 'POLLINATIONS';
    } else if (isBlockedDomain(img)) {
      reason = 'DOMINIO_BLOQUEADO';
    } else if ((imageUrlCount.get(img) || 0) > 1 && !isCloudinaryUrl(img) && !isUnsplashUrl(img)) {
      reason = 'DUPLICADA';
    }

    if (reason) {
      needsFix.push({ ...art, reason });
      console.log(`  [${reason}] "${art.title?.slice(0, 60)}" — ${img?.slice(0, 50) || 'null'}`);
    }

    // Para imágenes aparentemente OK pero externas, verificar accesibilidad
    // (solo verificamos 1 de cada 2 para no sobrecargar)
    if (!reason && img && !isCloudinaryUrl(img) && !isUnsplashUrl(img) && checked % 2 === 0) {
      const accessible = await isImageAccessible(img);
      if (!accessible) {
        needsFix.push({ ...art, reason: 'URL_INACCESIBLE' });
        console.log(`  [URL_INACCESIBLE] "${art.title?.slice(0, 60)}" — ${img?.slice(0, 50)}`);
      }
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   Total artículos:     ${articles.length}`);
  console.log(`   Necesitan reparación: ${needsFix.length}`);

  const byReason = {};
  for (const a of needsFix) {
    byReason[a.reason] = (byReason[a.reason] || 0) + 1;
  }
  for (const [reason, count] of Object.entries(byReason)) {
    console.log(`   ${reason}: ${count}`);
  }

  if (needsFix.length === 0) {
    console.log('\n✅ ¡Todas las imágenes están en orden!');
    return;
  }

  console.log(`\n🔧 Iniciando reparación de ${needsFix.length} artículos...\n`);
  console.log('═'.repeat(60));

  let fixed = 0;
  let failed = 0;

  for (let i = 0; i < needsFix.length; i++) {
    const art = needsFix[i];
    console.log(`\n[${i + 1}/${needsFix.length}] 📰 "${art.title?.slice(0, 65)}"`);
    console.log(`    Categoría: ${art.category} | Razón: ${art.reason}`);
    console.log(`    URL actual: ${art.image?.slice(0, 60) || 'null'}`);

    // Si tiene imagen externa accesible (no bloqueada, no pollinations), intentar primero internalizar
    let newUrl = null;

    if (art.image && !isPollinationsUrl(art.image) && !isBlockedDomain(art.image) && art.reason === 'URL_INACCESIBLE') {
      // Ya sabemos que no es accesible, ir directo a generar
      console.log(`    ↳ URL inaccesible, generando imagen editorial...`);
      newUrl = await generateAndUpload(art.title, art.category);
    } else if (art.image && !isPollinationsUrl(art.image) && !isBlockedDomain(art.image) && art.reason === 'DUPLICADA') {
      // Imagen duplicada pero potencialmente accesible → intentar internalizar a Cloudinary con URL diferente
      console.log(`    ↳ Imagen duplicada, generando imagen editorial única...`);
      newUrl = await generateAndUpload(art.title, art.category);
    } else {
      // Sin imagen, Pollinations, o dominio bloqueado → generar nueva
      console.log(`    ↳ ${art.reason === 'SIN_IMAGEN' ? 'Sin imagen' : 'Imagen problemática'}, generando imagen editorial...`);
      newUrl = await generateAndUpload(art.title, art.category);
    }

    if (newUrl) {
      // Actualizar en Supabase
      const { error: updateError } = await supabase
        .from('articles')
        .update({ image: newUrl })
        .eq('id', art.id);

      if (updateError) {
        console.log(`    ❌ Error actualizando BD: ${updateError.message}`);
        failed++;
      } else {
        console.log(`    ✅ Actualizado en BD: /articulo/${art.slug}`);
        fixed++;
      }
    } else {
      console.log(`    ❌ No se pudo generar imagen, artículo omitido.`);
      failed++;
    }

    // Pausa entre artículos para no sobrecargar Pollinations/Cloudinary
    if (i < needsFix.length - 1) {
      console.log(`    ⏳ Esperando 4s antes del siguiente...`);
      await sleep(4000);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 RESULTADO FINAL:');
  console.log(`   ✅ Reparados: ${fixed}`);
  console.log(`   ❌ Fallados:  ${failed}`);
  console.log(`   📋 Total:     ${needsFix.length}`);

  if (fixed > 0) {
    console.log('\n🎉 ¡Proceso completado! Las imágenes han sido actualizadas en Supabase.');
    console.log('   Los cambios se verán en el portal en el próximo revalidate (60s).');
  }
}

main().catch(err => {
  console.error('❌ Error fatal:', err.message);
  process.exit(1);
});
