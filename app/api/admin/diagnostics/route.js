/**
 * app/api/admin/diagnostics/route.js
 *
 * Sistema de Diagnóstico Completo — Imperio Público
 * Evalúa TODOS los subsistemas del portal y reporta errores con severidad.
 *
 * Niveles: "ok" | "warn" | "error"
 * Llamado por el workflow `selfcheck.yml` cada 2 horas.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.imperiopublico.com';

// ── Utilidades ────────────────────────────────────────────────────────────────
function result(name, status, message, data = {}) {
  return { name, status, message, data, ts: new Date().toISOString() };
}

async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ── Cheques individuales ──────────────────────────────────────────────────────

async function checkDatabase(supabase) {
  try {
    const { count, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    if (error) return result('database', 'error', `Supabase error: ${error.message}`);
    return result('database', 'ok', `Supabase conectado. ${count} artículos en BD.`, { count });
  } catch (e) {
    return result('database', 'error', `Excepción: ${e.message}`);
  }
}

async function checkBotStatus(supabase) {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'automation_enabled')
      .maybeSingle();
    const enabled = data?.value === true;
    return result('bot_status', enabled ? 'ok' : 'warn',
      enabled ? 'Bot de publicación ACTIVO.' : '⚠️ Bot pausado desde el panel admin.',
      { enabled });
  } catch (e) {
    return result('bot_status', 'error', `No se pudo leer settings: ${e.message}`);
  }
}

async function checkRecentActivity(supabase) {
  try {
    const todayDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const startOfDay = new Date(`${todayDR}T00:00:00-04:00`).toISOString();

    const { count: todayCount } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .gte('publishedAt', startOfDay);

    const { data: lastArt } = await supabase
      .from('articles')
      .select('publishedAt, title, category')
      .order('publishedAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    const lastTs = lastArt?.publishedAt ? new Date(lastArt.publishedAt) : null;
    const hoursSinceLast = lastTs ? (Date.now() - lastTs.getTime()) / 3600000 : 999;

    let status = 'ok';
    let message = `${todayCount} artículos hoy. Último hace ${Math.round(hoursSinceLast)}h.`;
    if (todayCount === 0 && new Date().getHours() >= 15) {
      status = 'warn';
      message = '⚠️ Ningún artículo publicado hoy pasadas las 3PM RD.';
    }
    if (hoursSinceLast > 26) {
      status = 'error';
      message = `❌ Sin actividad desde hace ${Math.round(hoursSinceLast)}h. El bot puede estar caído.`;
    }
    return result('recent_activity', status, message, {
      todayCount, hoursSinceLast: Math.round(hoursSinceLast), last: lastArt,
    });
  } catch (e) {
    return result('recent_activity', 'error', `Error: ${e.message}`);
  }
}

async function checkBrokenImages(supabase) {
  try {
    const { data } = await supabase
      .from('articles')
      .select('image')
      .order('publishedAt', { ascending: false })
      .limit(200);

    const broken = (data || []).filter(a =>
      a.image &&
      !a.image.includes('cloudinary.com') &&
      !a.image.includes('unsplash.com') &&
      !a.image.includes('pollinations.ai') &&
      !a.image.startsWith('/')
    );

    const pct = data?.length ? Math.round((broken.length / data.length) * 100) : 0;
    const status = broken.length === 0 ? 'ok' : broken.length < 10 ? 'warn' : 'error';
    return result('images', status,
      broken.length === 0
        ? '✅ Todas las imágenes están en Cloudinary/CDN.'
        : `⚠️ ${broken.length} imágenes externas detectadas (${pct}% de los últimos 200 arts).`,
      { broken: broken.length, total: data?.length, pct });
  } catch (e) {
    return result('images', 'error', `Error al revisar imágenes: ${e.message}`);
  }
}

async function checkCategoryDistribution(supabase) {
  try {
    const todayDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const startOfDay = new Date(`${todayDR}T00:00:00-04:00`).toISOString();

    const { data } = await supabase
      .from('articles')
      .select('category')
      .gte('publishedAt', startOfDay);

    const dist = {};
    (data || []).forEach(a => { dist[a.category] = (dist[a.category] || 0) + 1; });
    const dupes = Object.entries(dist).filter(([, c]) => c > 1).map(([cat, c]) => `${cat}(${c})`);

    return result('category_distribution', dupes.length > 0 ? 'warn' : 'ok',
      dupes.length > 0
        ? `⚠️ Categorías con más de 1 artículo hoy: ${dupes.join(', ')}`
        : `✅ Distribución correcta: ${Object.keys(dist).length} categorías publicadas hoy.`,
      { dist });
  } catch (e) {
    return result('category_distribution', 'error', `Error: ${e.message}`);
  }
}

async function checkGeminiKeys() {
  const keys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
  ].filter(Boolean);

  if (keys.length === 0) {
    return result('gemini_keys', 'error', '❌ No hay claves Gemini configuradas en variables de entorno.');
  }

  const results = [];
  for (const key of keys) {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: 'Di OK en una palabra.' }] }] }),
        },
        12000
      );
      const data = await res.json();
      if (data.error?.code === 429 || data.error?.status === 'RESOURCE_EXHAUSTED') {
        results.push({ key: `...${key.slice(-6)}`, status: 'quota_exhausted' });
      } else if (data.candidates?.[0]?.content) {
        results.push({ key: `...${key.slice(-6)}`, status: 'ok' });
      } else {
        results.push({ key: `...${key.slice(-6)}`, status: 'error', msg: data.error?.message?.slice(0, 60) });
      }
    } catch (e) {
      results.push({ key: `...${key.slice(-6)}`, status: 'timeout_or_error', msg: e.message });
    }
  }

  const okKeys    = results.filter(r => r.status === 'ok').length;
  const quotaKeys = results.filter(r => r.status === 'quota_exhausted').length;
  const errKeys   = results.filter(r => r.status !== 'ok' && r.status !== 'quota_exhausted').length;

  let status = 'ok';
  let message = `✅ ${okKeys}/${keys.length} claves Gemini activas.`;
  if (okKeys === 0 && quotaKeys > 0) {
    status = 'warn'; message = `⚠️ Todas las claves Gemini tienen cuota agotada. El bot usará Pollinations.`;
  }
  if (okKeys === 0 && quotaKeys === 0) {
    status = 'error'; message = `❌ Ninguna clave Gemini funciona correctamente.`;
  }
  if (quotaKeys > 0 && okKeys > 0) {
    message += ` ${quotaKeys} con cuota agotada.`;
  }
  return result('gemini_keys', status, message, { results, okKeys, quotaKeys, errKeys });
}

async function checkCloudinary() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key   = process.env.CLOUDINARY_API_KEY;
  const sec   = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !sec) {
    return result('cloudinary', 'error', '❌ Credenciales de Cloudinary no configuradas.');
  }
  try {
    const auth = Buffer.from(`${key}:${sec}`).toString('base64');
    const res = await fetchWithTimeout(
      `https://api.cloudinary.com/v1_1/${cloud}/usage`,
      { headers: { Authorization: `Basic ${auth}` } },
      8000
    );
    if (res.ok) {
      const data = await res.json();
      const usedMB = Math.round((data.storage?.usage || 0) / 1024 / 1024);
      return result('cloudinary', 'ok', `✅ Cloudinary activo. ${usedMB} MB usados.`, { usedMB });
    }
    return result('cloudinary', 'error', `❌ Cloudinary respondió ${res.status}.`);
  } catch (e) {
    return result('cloudinary', 'error', `❌ Error conectando Cloudinary: ${e.message}`);
  }
}

async function checkFeeds() {
  const feeds = [
    'https://www.diariolibre.com/rss/portada.xml',
    'https://almomento.net/feed/',
    'https://noticiassin.com/feed/',
  ];
  const results = [];
  for (const url of feeds) {
    try {
      const res = await fetchWithTimeout(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ImperioPublico/2.0)' },
      }, 7000);
      results.push({ url: url.slice(0, 40), status: res.ok ? 'ok' : `http_${res.status}` });
    } catch (e) {
      results.push({ url: url.slice(0, 40), status: 'timeout_or_error' });
    }
  }
  const failed = results.filter(r => r.status !== 'ok').length;
  const status = failed === 0 ? 'ok' : failed < feeds.length ? 'warn' : 'error';
  return result('rss_feeds', status,
    failed === 0
      ? `✅ ${feeds.length}/${feeds.length} feeds RSS accesibles.`
      : `⚠️ ${failed}/${feeds.length} feeds fallaron.`,
    { results });
}

async function checkSiteReachable() {
  try {
    const res = await fetchWithTimeout(SITE_URL, {}, 10000);
    if (res.ok || res.status === 304) {
      return result('site_reachable', 'ok', `✅ Sitio responde correctamente (HTTP ${res.status}).`);
    }
    return result('site_reachable', 'error', `❌ Sitio devolvió HTTP ${res.status}.`);
  } catch (e) {
    return result('site_reachable', 'error', `❌ Sitio no alcanzable: ${e.message}`);
  }
}

async function checkNewsletterTable(supabase) {
  try {
    const { count, error } = await supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true });
    if (error) return result('newsletter', 'warn', `⚠️ Tabla newsletter_subscribers: ${error.message}`);
    return result('newsletter', 'ok', `✅ Newsletter activo. ${count} suscriptores.`, { count });
  } catch (e) {
    return result('newsletter', 'error', `Error: ${e.message}`);
  }
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const started = Date.now();

  // Ejecutar todos los cheques en paralelo (excepto los que dependen de otros)
  const [
    db,
    bot,
    activity,
    images,
    cats,
    site,
    feeds,
    cloudinary,
    newsletter,
    gemini,
  ] = await Promise.all([
    checkDatabase(supabase),
    checkBotStatus(supabase),
    checkRecentActivity(supabase),
    checkBrokenImages(supabase),
    checkCategoryDistribution(supabase),
    checkSiteReachable(),
    checkFeeds(),
    checkCloudinary(),
    checkNewsletterTable(supabase),
    checkGeminiKeys(),
  ]);

  const checks = [db, bot, activity, images, cats, site, feeds, cloudinary, newsletter, gemini];

  const errors  = checks.filter(c => c.status === 'error').length;
  const warns   = checks.filter(c => c.status === 'warn').length;
  const oks     = checks.filter(c => c.status === 'ok').length;

  const globalStatus = errors > 0 ? 'critical' : warns > 0 ? 'degraded' : 'healthy';
  const elapsed = Date.now() - started;

  const report = {
    portal:  'Imperio Público',
    status:  globalStatus,
    summary: { errors, warns, oks, total: checks.length },
    elapsed: `${elapsed}ms`,
    timestamp: new Date().toISOString(),
    checks,
  };

  // Log visible en Vercel Functions
  console.log(`[Diagnostics] Status: ${globalStatus} | Errors: ${errors} | Warns: ${warns} | OK: ${oks} | ${elapsed}ms`);

  return NextResponse.json(report, {
    status: errors > 0 ? 503 : 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
