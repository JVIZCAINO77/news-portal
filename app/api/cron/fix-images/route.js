/**
 * /api/cron/fix-images — Guardián nocturno de imágenes
 *
 * Se ejecuta automáticamente 1 vez al día a las 2:00 AM UTC (10 PM RD).
 * Escanea TODOS los artículos y repara cualquiera que tenga imagen no-Cloudinary:
 *   - NULL / vacía
 *   - URL de Pollinations AI (inestable, lenta, genera duplicados visuales)
 *   - URL de dominio bloqueado (hotlink protection)
 *   - Cualquier URL externa que no sea Cloudinary ni Unsplash
 *
 * Para cada artículo roto:
 *   1. Genera imagen editorial única con Pollinations AI (seed único por artículo)
 *   2. Sube a Cloudinary (3 reintentos)
 *   3. Actualiza la BD
 *
 * Límite de proceso: procesa máximo 30 artículos por ejecución para no exceder
 * el timeout de Vercel (maxDuration: 60s).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { internalizeImage } from '@/lib/botUtils';

export const maxDuration = 55; // Hobby: límite real es 60s, 55s da margen de seguridad

// Dominios problemáticos — cualquier imagen de estas fuentes debe reemplazarse
const BLOCKED_DOMAINS = [
  'pollinations.ai',
  'image.pollinations.ai',
  'diariolibre.com',
  'listindiario.com',
  'eldinero.com.do',
  'elcaribe.com.do',
  'elnacional.com.do',
  'hoy.com.do',
  'acento.com.do',
  'noticiassin.com',
  'almomento.net',
  'remolacha.net',
  'primerahora.com',
  'elnuevodia.com',
  'z101digital.com',
];

function isProblematic(url) {
  if (!url || url.trim() === '') return true;
  if (url.includes('cloudinary.com')) return false; // ✅ OK
  if (url.includes('unsplash.com')) return false;   // ✅ OK (fallback estable)
  // Cualquier otra URL: verificar si es de dominio bloqueado
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return BLOCKED_DOMAINS.some(d => hostname === d || hostname.endsWith('.' + d));
  } catch {
    return true; // URL inválida
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildPollinationsUrl(title, category) {
  // Seed único por artículo para evitar imágenes duplicadas entre artículos similares
  const seed = Math.floor(Math.random() * 9999999) + Date.now() % 100000;
  const prompt = `high-quality editorial news photograph. Article: "${title.slice(0, 100)}". Category: ${category}. Professional photojournalism, dramatic lighting, cinematic, wide shot, 8k, photorealistic. NO TEXT, NO LETTERS, NO LOGOS.`;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&enhance=true&seed=${seed}`;
}

export async function GET(request) {
  // ── Guardia dual — igual que todos los crons del sistema ────────────────────
  const CRON_SECRET   = process.env.CRON_SECRET;
  const isVercelCron  = request.headers.get('x-vercel-cron') === '1';
  const authHeader    = request.headers.get('authorization');
  const querySecret   = new URL(request.url).searchParams.get('secret');
  const hasValidToken = !!CRON_SECRET &&
    (authHeader === `Bearer ${CRON_SECRET}` || querySecret === CRON_SECRET);

  if (!isVercelCron && !hasValidToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const MAX_PROCESS = 30; // Máximo artículos por ejecución
  const MAX_RUNTIME = 50000; // 50 segundos (margen de 10s para respuesta)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ── 1. Cargar artículos más recientes (los más visibles) ───────────────────
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, category, image, slug')
    .order('publishedAt', { ascending: false })
    .limit(300); // Analizar los últimos 300 artículos

  if (error) {
    console.error('[ImageGuardian] Error cargando artículos:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── 2. Filtrar artículos con imágenes problemáticas ────────────────────────
  const toFix = articles
    .filter(a => isProblematic(a.image))
    .slice(0, MAX_PROCESS);

  console.log(`[ImageGuardian] 📊 Total analizados: ${articles.length} | Con imagen problemática: ${articles.filter(a => isProblematic(a.image)).length} | Procesando: ${toFix.length}`);

  if (toFix.length === 0) {
    return NextResponse.json({
      success: true,
      message: '✅ Todas las imágenes están en orden (Cloudinary/Unsplash).',
      analyzed: articles.length,
      fixed: 0,
    });
  }

  // ── 3. Reparar cada artículo ────────────────────────────────────────────────
  const results = { fixed: 0, failed: 0, skipped: 0, details: [] };

  for (const art of toFix) {
    // Verificar tiempo disponible (dejar 10s de margen)
    if (Date.now() - startTime > MAX_RUNTIME) {
      console.log(`[ImageGuardian] ⏱ Tiempo límite alcanzado. Procesados ${results.fixed + results.failed} de ${toFix.length}.`);
      results.skipped = toFix.length - results.fixed - results.failed;
      break;
    }

    console.log(`[ImageGuardian] 🔧 Reparando: "${art.title?.slice(0, 60)}" (${art.category})`);
    console.log(`[ImageGuardian]    URL actual: ${art.image?.slice(0, 60) || 'null'}`);

    const polUrl = buildPollinationsUrl(art.title, art.category);

    // Esperar un poco antes de llamar a Pollinations (evitar rate limit)
    await sleep(2000);

    // Intentar internalizar con hasta 2 reintentos
    const newUrl = await internalizeImage(polUrl, 2);

    if (newUrl && newUrl.includes('cloudinary.com')) {
      const { error: updateErr } = await supabase
        .from('articles')
        .update({ image: newUrl, updated_at: new Date().toISOString() })
        .eq('id', art.id);

      if (updateErr) {
        console.error(`[ImageGuardian] ❌ Error BD para ${art.slug}: ${updateErr.message}`);
        results.failed++;
        results.details.push({ slug: art.slug, status: 'error_db', error: updateErr.message });
      } else {
        console.log(`[ImageGuardian] ✅ Reparado: ${art.slug}`);
        results.fixed++;
        results.details.push({ slug: art.slug, status: 'fixed', newUrl: newUrl.slice(0, 60) });
      }
    } else {
      console.warn(`[ImageGuardian] ❌ No se pudo generar imagen para: ${art.slug}`);
      results.failed++;
      results.details.push({ slug: art.slug, status: 'failed', title: art.title?.slice(0, 40) });
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[ImageGuardian] 🏁 Completado en ${duration}s — Reparados: ${results.fixed} | Fallados: ${results.failed} | Omitidos: ${results.skipped}`);

  return NextResponse.json({
    success: true,
    duration: `${duration}s`,
    analyzed: articles.length,
    found_problematic: articles.filter(a => isProblematic(a.image)).length,
    processed: toFix.length,
    fixed: results.fixed,
    failed: results.failed,
    skipped: results.skipped,
    details: results.details.slice(0, 20), // Primeros 20 para el log
  });
}
