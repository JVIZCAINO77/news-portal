/**
 * full_audit.js — Auditoría completa del sistema Imperio Público
 * Evalúa: BD, seguridad, integridad de datos, APIs
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SITE_URL = 'https://www.imperiopublico.com';

async function checkDB() {
  console.log('\n══════════════════════════════════════');
  console.log('📦 BASE DE DATOS — Supabase');
  console.log('══════════════════════════════════════');

  // Total artículos
  const { count: totalArticles } = await supabase.from('articles').select('*', { count: 'exact', head: true });
  console.log(`✅ Total artículos: ${totalArticles}`);

  // Artículos por categoría
  const { data: byCat } = await supabase.from('articles').select('category');
  const catCounts = {};
  (byCat || []).forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
  console.log('\n📂 Por sección:');
  Object.entries(catCounts).sort(([,a],[,b]) => b-a).forEach(([cat, n]) => {
    const bar = '█'.repeat(Math.round(n / totalArticles * 20));
    console.log(`   ${cat.padEnd(20)} ${n.toString().padStart(3)} ${bar}`);
  });

  // Artículos sin imagen
  const { count: noImage } = await supabase.from('articles')
    .select('*', { count: 'exact', head: true })
    .or('image.is.null,image.eq.');
  console.log(`\n⚠️  Sin imagen: ${noImage}`);

  // Artículos sin excerpt
  const { count: noExcerpt } = await supabase.from('articles')
    .select('*', { count: 'exact', head: true })
    .or('excerpt.is.null,excerpt.eq.');
  console.log(`⚠️  Sin excerpt: ${noExcerpt}`);

  // Artículos hoy
  const todayDR = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const startToday = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
  const endToday = new Date(`${todayDR}T23:59:59-04:00`).toISOString();
  const { count: todayCount } = await supabase.from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('publishedAt', startToday).lte('publishedAt', endToday);
  console.log(`\n📅 Publicados hoy (${todayDR}): ${todayCount}`);

  // Duplicados por source_link
  const { data: allLinks } = await supabase.from('articles').select('source_link').not('source_link', 'is', null);
  const linkMap = {};
  (allLinks || []).forEach(a => { linkMap[a.source_link] = (linkMap[a.source_link] || 0) + 1; });
  const dupes = Object.entries(linkMap).filter(([, n]) => n > 1);
  console.log(`\n🔁 Duplicados detectados: ${dupes.length}`);
  if (dupes.length > 0) dupes.slice(0, 3).forEach(([link, n]) => console.log(`   (${n}x) ${link.slice(0, 60)}`));

  // Tablas disponibles
  const { data: tables } = await supabase.rpc('get_table_names').catch(() => ({ data: null }));
  if (tables) console.log(`\n📋 Tablas: ${tables.map(t => t.tablename).join(', ')}`);

  return { totalArticles, noImage, noExcerpt, todayCount, dupes: dupes.length };
}

async function checkSecurity() {
  console.log('\n══════════════════════════════════════');
  console.log('🔐 SEGURIDAD');
  console.log('══════════════════════════════════════');

  const checks = [];

  // Verificar que las variables críticas están definidas
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'CRON_SECRET',
    'NEXT_PUBLIC_SITE_URL',
  ];
  for (const env of requiredEnvs) {
    const val = process.env[env];
    if (val) {
      console.log(`✅ ${env}: configurada`);
    } else {
      console.log(`❌ ${env}: FALTANTE`);
      checks.push(`Variable ${env} no configurada`);
    }
  }

  // Verificar cuántas claves Gemini hay
  const geminiKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  console.log(`\n🔑 Claves Gemini configuradas: ${geminiKeys.length}`);
  geminiKeys.forEach((k, i) => console.log(`   ${i + 1}. ...${k.slice(-6)}`));

  // Verificar CRON_SECRET no es el default inseguro
  if (process.env.CRON_SECRET === 'mi-secreto-super-seguro') {
    console.log('\n⚠️  CRON_SECRET usa valor por defecto inseguro');
    checks.push('CRON_SECRET debe cambiarse');
  } else {
    console.log(`\n✅ CRON_SECRET: personalizada`);
  }

  // Verificar REVALIDATE_SECRET
  if (process.env.REVALIDATE_SECRET === 'mi-secreto-super-seguro') {
    console.log('⚠️  REVALIDATE_SECRET usa valor por defecto inseguro');
    checks.push('REVALIDATE_SECRET debe cambiarse');
  } else {
    console.log(`✅ REVALIDATE_SECRET: personalizada`);
  }

  return checks;
}

async function checkAPIs() {
  console.log('\n══════════════════════════════════════');
  console.log('🌐 ENDPOINTS WEB — imperiopublico.com');
  console.log('══════════════════════════════════════');

  const endpoints = [
    { url: `${SITE_URL}/`, label: 'Página principal' },
    { url: `${SITE_URL}/api/articles/latest`, label: 'API últimas noticias' },
    { url: `${SITE_URL}/feed.xml`, label: 'Feed RSS' },
    { url: `${SITE_URL}/news-sitemap.xml`, label: 'Sitemap de noticias' },
    { url: `${SITE_URL}/sitemap.xml`, label: 'Sitemap principal' },
    { url: `${SITE_URL}/api/cron/bot?category=noticias`, label: 'Bot cron (sin auth) — debe dar 401' },
  ];

  const results = [];
  for (const ep of endpoints) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(ep.url, { signal: controller.signal, headers: { 'User-Agent': 'AuditBot/1.0' } });
      clearTimeout(timeout);
      const status = res.status;
      const ok = ep.label.includes('401') ? status === 401 : status < 400;
      const icon = ok ? '✅' : '❌';
      console.log(`${icon} [${status}] ${ep.label}`);
      results.push({ label: ep.label, status, ok });
    } catch (e) {
      console.log(`❌ [ERR] ${ep.label}: ${e.message.slice(0, 50)}`);
      results.push({ label: ep.label, status: 'ERR', ok: false });
    }
  }
  return results;
}

async function checkGeminiKeys() {
  console.log('\n══════════════════════════════════════');
  console.log('🤖 CLAVES GEMINI — Estado');
  console.log('══════════════════════════════════════');

  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const model = 'gemini-3.1-flash-lite';
  const prompt = 'Di "OK" en español.';
  let active = 0;

  for (const key of keys) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      if (data.error) {
        const code = data.error.code;
        const label = code === 429 ? 'CUOTA AGOTADA' : code === 400 ? 'CLAVE INVÁLIDA' : code === 403 ? 'ACCESO DENEGADO' : data.error.message.slice(0, 30);
        console.log(`⚠️  ...${key.slice(-6)}: ${label}`);
      } else {
        console.log(`✅  ...${key.slice(-6)}: ACTIVA`);
        active++;
      }
    } catch (e) {
      console.log(`❌  ...${key.slice(-6)}: Error de red`);
    }
  }

  console.log(`\n📊 Claves activas: ${active} / ${keys.length}`);
  return { active, total: keys.length };
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('🔍 AUDITORÍA COMPLETA — Imperio Público');
  console.log(`📅 ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}`);
  console.log('═══════════════════════════════════════════════');

  const [dbResult, secIssues, apiResults, geminiResult] = await Promise.all([
    checkDB(),
    checkSecurity(),
    checkAPIs(),
    checkGeminiKeys(),
  ]);

  console.log('\n══════════════════════════════════════');
  console.log('📋 RESUMEN EJECUTIVO');
  console.log('══════════════════════════════════════');
  console.log(`📦 Base de datos:    ${dbResult.totalArticles} artículos, ${dbResult.todayCount} hoy, ${dbResult.dupes} duplicados`);
  console.log(`🤖 Gemini:           ${geminiResult.active}/${geminiResult.total} claves activas`);
  console.log(`🌐 Web endpoints:    ${apiResults.filter(r => r.ok).length}/${apiResults.length} OK`);
  console.log(`🔐 Seguridad:        ${secIssues.length === 0 ? '✅ Sin problemas críticos' : `⚠️ ${secIssues.length} alerta(s): ${secIssues.join(', ')}`}`);
  if (dbResult.noImage > 0) console.log(`🖼️  Imágenes faltantes: ${dbResult.noImage} artículos`);
}

main().catch(console.error);
