/**
 * fix-all-images-v2.mjs
 * Versión mejorada: detecta y repara imágenes problemáticas artículo por artículo.
 * 
 * PROBLEMAS QUE DETECTA:
 *  1. NULL / vacías
 *  2. Pollinations AI (lentas, generan el mismo resultado visual para temas similares)
 *  3. Dominios que bloquean hotlinking (redirigen a login/placeholder)
 *  4. Imágenes DUPLICADAS — la misma URL usada en 2+ artículos
 *  5. URLs que responden error HTTP en el servidor
 *
 * Uso: node scripts/fix-all-images-v2.mjs
 * Flags opcionales:
 *   --dry-run   : Solo muestra el reporte, no actualiza la BD
 *   --only-null : Solo repara artículos sin imagen
 *   --limit=50  : Procesa máximo N artículos problemáticos
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── Parsear argumentos CLI ───────────────────────────────────────────────────
const args = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const ONLY_NULL = args.includes('--only-null');
const limitArg  = args.find(a => a.startsWith('--limit='));
const LIMIT     = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://vprjbntwebhzjjcnlztc.supabase.co';
const SUPABASE_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmpibnR3ZWJoempqY25senRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA4OTMwNSwiZXhwIjoyMDkwNjY1MzA1fQ.zdwco4O57L2X2xzuj0H28plAxWqRF6vwYJIl9qGLhGM';
const CLOUD_NAME       = 'dkkw77byz';
const CLOUD_API_KEY    = '293867698721174';
const CLOUD_API_SECRET = 'rAfhniOqMOXNHWCadSveV32zWl0';

// Dominios que bloquean hotlinking — siempre necesitan reemplazo
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
  'remolacha.net',
  'almamanews.com',
  'primerahora.com',
  'elnuevodia.com',
]);

// ── Helpers ──────────────────────────────────────────────────────────────────
function isBlockedDomain(url) {
  if (!url) return false;
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return [...BLOCKED_DOMAINS].some(d => domain === d || domain.endsWith('.' + d));
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

function isStableUrl(url) {
  return isCloudinaryUrl(url) || isUnsplashUrl(url);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function buildPollinationsUrl(title, category) {
  const seed = Date.now() + Math.floor(Math.random() * 999999);
  const prompt = `high-quality editorial news photograph for article: "${title.slice(0, 100)}". Topic: ${category}. Style: professional photojournalism, dramatic lighting, cinematic, 8k, wide shot. NO TEXT, NO LETTERS, NO LOGOS, NO SIGNS.`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&enhance=true&seed=${seed}`;
}

async function uploadToCloudinary(imageUrl) {
  try {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'imperio-publico/editorial';
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
      { method: 'POST', body: formData, signal: AbortSignal.timeout(90000) }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log(`    ⚠️  Cloudinary: ${err.error?.message || res.status}`);
      return null;
    }

    const data = await res.json();
    return data.secure_url || null;
  } catch (e) {
    if (e.name === 'TimeoutError' || e.name === 'AbortError') {
      console.log(`    ⚠️  Cloudinary timeout (90s)`);
    } else {
      console.log(`    ⚠️  Cloudinary error: ${e.message?.slice(0, 60)}`);
    }
    return null;
  }
}

/**
 * Verifica si una URL responde con una imagen válida (HTTP 200 + image/*)
 * Usa GET con rango pequeño para no descargar todo
 */
async function checkImageUrl(url) {
  if (isStableUrl(url)) return true; // Cloudinary/Unsplash siempre OK
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'es-DO,es;q=0.9',
        'Referer': 'https://imperiopublico.com/',
        'Range': 'bytes=0-1023', // Solo primeros 1KB para detectar si es imagen
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });
    if (!res.ok && res.status !== 206) return false;
    const ct = res.headers.get('content-type') || '';
    return ct.includes('image/') || ct.includes('octet-stream');
  } catch {
    return false;
  }
}

async function generateAndUpload(title, category, attempt = 1) {
  const polUrl = buildPollinationsUrl(title, category);
  console.log(`    🎨 Generando (intento ${attempt}/3): ${polUrl.slice(0, 75)}...`);
  
  // Esperar que Pollinations genere la imagen
  await sleep(5000 + (attempt * 2000));
  
  const cloudUrl = await uploadToCloudinary(polUrl);
  if (cloudUrl) return cloudUrl;
  
  if (attempt < 3) {
    console.log(`    🔄 Reintentando...`);
    await sleep(5000);
    return generateAndUpload(title, category, attempt + 1);
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  if (DRY_RUN) console.log('🧪 MODO DRY-RUN: no se actualizará la base de datos\n');

  console.log('🔍 Cargando artículos de Supabase...');
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, category, image, slug, publishedAt')
    .order('publishedAt', { ascending: false });

  if (error) { console.error('❌', error.message); process.exit(1); }
  console.log(`📋 Total: ${articles.length} artículos\n`);

  // ── PASO 1: Contar ocurrencias de cada imagen (para detectar duplicados) ──
  const imgCount = new Map();
  for (const a of articles) {
    if (a.image) {
      imgCount.set(a.image, (imgCount.get(a.image) || 0) + 1);
    }
  }

  const duplicateUrls = new Set(
    [...imgCount.entries()]
      .filter(([url, count]) => count > 1 && !isStableUrl(url))
      .map(([url]) => url)
  );

  console.log(`🔁 URLs de imagen duplicadas encontradas (sin Cloudinary/Unsplash): ${duplicateUrls.size}`);

  // ── PASO 2: Clasificar artículos problemáticos ─────────────────────────────
  console.log('\n🔎 Verificando imágenes artículo por artículo...\n');

  const toFix = [];
  const already = new Map(); // Para tracking de duplicados ya marcados

  for (const art of articles) {
    if (toFix.length >= LIMIT) break;

    const img = art.image;
    let reason = null;
    let info   = '';

    if (!img || img.trim() === '') {
      reason = 'SIN_IMAGEN';
    } else if (ONLY_NULL) {
      continue; // En modo only-null, saltamos todo lo demás
    } else if (isBlockedDomain(img)) {
      reason = 'DOMINIO_BLOQUEADO';
      info = new URL(img).hostname;
    } else if (isPollinationsUrl(img)) {
      reason = 'POLLINATIONS';
    } else if (duplicateUrls.has(img)) {
      // Primer artículo con esta imagen: lo marcamos pero lo "aceptamos"
      // Segundo artículo y siguientes: necesitan imagen nueva
      if (!already.has(img)) {
        already.set(img, art.id);
        // El primer artículo con imagen duplicada lo dejamos, los demás los reparamos
      } else {
        reason = 'DUPLICADA';
        info = `misma que artículo ID ${already.get(img)}`;
      }
    } else if (!isStableUrl(img)) {
      // URL externa no en lista negra → verificar accesibilidad
      process.stdout.write(`  🔍 Verificando ${art.slug?.slice(0, 40)}... `);
      const ok = await checkImageUrl(img);
      if (!ok) {
        reason = 'INACCESIBLE';
        info = img.slice(0, 50);
        console.log(`❌`);
      } else {
        console.log(`✅`);
      }
    }

    if (reason) {
      toFix.push({ ...art, reason, info });
      const tag = reason === 'SIN_IMAGEN' ? '🚫' : reason === 'DUPLICADA' ? '🔁' : reason === 'POLLINATIONS' ? '🐌' : reason === 'INACCESIBLE' ? '🔴' : '⛔';
      console.log(`  ${tag} [${reason}] "${art.title?.slice(0, 55)}" ${info ? '← '+info : ''}`);
    }
  }

  // ── PASO 3: Reporte ────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(65));
  console.log('📊 REPORTE DE IMÁGENES PROBLEMÁTICAS:');
  console.log(`   Total artículos analizados:  ${articles.length}`);
  console.log(`   Artículos a reparar:         ${toFix.length}`);

  const byReason = {};
  for (const a of toFix) byReason[a.reason] = (byReason[a.reason] || 0) + 1;
  for (const [r, c] of Object.entries(byReason)) {
    const icon = { SIN_IMAGEN:'🚫', DUPLICADA:'🔁', POLLINATIONS:'🐌', DOMINIO_BLOQUEADO:'⛔', INACCESIBLE:'🔴' }[r] || '❓';
    console.log(`   ${icon} ${r}: ${c}`);
  }
  console.log('═'.repeat(65));

  if (toFix.length === 0) {
    console.log('\n✅ ¡Todas las imágenes están en perfecto estado!');
    return;
  }

  if (DRY_RUN) {
    console.log('\n🧪 Dry-run completo. Para aplicar cambios: node scripts/fix-all-images-v2.mjs');
    return;
  }

  // ── PASO 4: Reparar ────────────────────────────────────────────────────────
  console.log(`\n🔧 Reparando ${toFix.length} artículos...\n`);

  let fixed = 0, failed = 0;

  for (let i = 0; i < toFix.length; i++) {
    const art = toFix[i];
    const num = `[${i + 1}/${toFix.length}]`;

    console.log(`\n${num} 📰 "${art.title?.slice(0, 65)}"`);
    console.log(`     📂 ${art.category} | ⚠️  ${art.reason}${art.info ? ' — '+art.info : ''}`);
    console.log(`     🔗 /articulo/${art.slug}`);

    // Generar imagen editorial única con el título + categoría del artículo
    const newUrl = await generateAndUpload(art.title, art.category);

    if (newUrl && !DRY_RUN) {
      const { error: err } = await supabase
        .from('articles')
        .update({ image: newUrl })
        .eq('id', art.id);

      if (err) {
        console.log(`     ❌ Error BD: ${err.message}`);
        failed++;
      } else {
        console.log(`     ✅ Imagen actualizada en BD`);
        fixed++;
      }
    } else if (!newUrl) {
      console.log(`     ❌ No se pudo generar imagen para este artículo`);
      failed++;
    } else {
      console.log(`     🧪 [dry-run] Se actualizaría con: ${newUrl?.slice(0, 60)}`);
      fixed++;
    }

    // Pausa entre artículos para no sobrecargar las APIs
    if (i < toFix.length - 1) await sleep(3000);
  }

  console.log('\n' + '═'.repeat(65));
  console.log('🏁 PROCESO COMPLETADO:');
  console.log(`   ✅ Reparados: ${fixed}/${toFix.length}`);
  console.log(`   ❌ Fallados:  ${failed}/${toFix.length}`);

  if (fixed > 0) {
    console.log('\n🎉 Las imágenes han sido actualizadas en Supabase.');
    console.log('   Los cambios serán visibles en el portal en ~60 segundos.');
  }
}

main().catch(e => { console.error('❌ Fatal:', e.message); process.exit(1); });
