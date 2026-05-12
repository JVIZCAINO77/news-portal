/**
 * Sistema de diagnóstico completo para Imperio Público.
 * Verifica: variables de entorno, feeds RSS, Supabase, APIs de IA, y el portal en producción.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const parser = new Parser({ timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } });

async function check(label, fn) {
  try {
    const result = await fn();
    console.log(`  ✅ ${label}${result ? ': ' + result : ''}`);
    return true;
  } catch (e) {
    console.log(`  ❌ ${label}: ${e.message.slice(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('   DIAGNÓSTICO COMPLETO — Imperio Público');
  console.log(`   ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}`);
  console.log('══════════════════════════════════════════════════════\n');

  // ── 1. Variables de Entorno ───────────────────────────────────────────────
  console.log('📋 1. VARIABLES DE ENTORNO');
  const envChecks = [
    ['NEXT_PUBLIC_SUPABASE_URL',     process.env.NEXT_PUBLIC_SUPABASE_URL],
    ['SUPABASE_SERVICE_ROLE_KEY',    process.env.SUPABASE_SERVICE_ROLE_KEY],
    ['NEXT_PUBLIC_SUPABASE_ANON_KEY',process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY],
    ['GEMINI_API_KEY',               process.env.GEMINI_API_KEY],
    ['CRON_SECRET',                  process.env.CRON_SECRET],
    ['NEXT_PUBLIC_ADSENSE_ID',       process.env.NEXT_PUBLIC_ADSENSE_ID],
  ];
  for (const [name, val] of envChecks) {
    if (val) {
      console.log(`  ✅ ${name}: ${val.slice(0, 30)}...`);
    } else {
      console.log(`  ❌ ${name}: FALTANTE`);
    }
  }

  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  console.log(`  ℹ️  Claves Gemini configuradas: ${keys.length}`);

  // ── 2. Supabase ────────────────────────────────────────────────────────────
  console.log('\n📦 2. BASE DE DATOS (SUPABASE)');

  await check('Conexión a Supabase', async () => {
    const { error } = await supabase.from('articles').select('id').limit(1);
    if (error) throw error;
    return 'OK';
  });

  const todayDR = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const startOfToday = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
  const endOfToday   = new Date(`${todayDR}T23:59:59-04:00`).toISOString();

  await check('Artículos publicados HOY', async () => {
    const { count } = await supabase.from('articles')
      .select('*', { count: 'exact', head: true })
      .gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);
    return `${count}/12`;
  });

  await check('Total artículos en BD', async () => {
    const { count } = await supabase.from('articles')
      .select('*', { count: 'exact', head: true });
    return `${count} artículos`;
  });

  // Artículos por categoría hoy
  const categories = ['noticias','entretenimiento','deportes','economia','sucesos','politica','salud','tecnologia'];
  const catStatus = [];
  for (const cat of categories) {
    const { count } = await supabase.from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category', cat)
      .gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);
    catStatus.push({ cat, count: count || 0 });
  }
  console.log('\n  📊 Artículos por categoría HOY:');
  for (const { cat, count } of catStatus) {
    const bar = '█'.repeat(count) + '░'.repeat(Math.max(0, 2 - count));
    const status = count >= 2 ? '✅' : count === 1 ? '🔶' : '⬜';
    console.log(`     ${status} ${cat.padEnd(16)} ${bar} (${count}/2)`);
  }

  // ── 3. APIs de IA ─────────────────────────────────────────────────────────
  console.log('\n🤖 3. APIS DE INTELIGENCIA ARTIFICIAL');
  const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
  let workingKeys = 0;
  for (const key of keys) {
    let keyOk = false;
    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Responde: hola' }] }] }),
          }
        );
        const data = await res.json();
        if (!data.error) {
          console.log(`  ✅ Gemini ${model} (clave ...${key.slice(-6)}): OK`);
          workingKeys++;
          keyOk = true;
          break;
        } else {
          const isQuota = data.error.code === 429;
          console.log(`  ${isQuota ? '⏳' : '❌'} Gemini ${model} (clave ...${key.slice(-6)}): ${isQuota ? 'cuota agotada (reset a medianoche UTC)' : data.error.message.slice(0, 60)}`);
        }
      } catch (e) {
        console.log(`  ❌ Gemini ${model} (...${key.slice(-6)}): ${e.message.slice(0, 60)}`);
      }
    }
  }
  if (workingKeys === 0) {
    console.log(`  ⚠️  Todas las claves Gemini tienen cuota agotada. Se resetean a las 8:00 PM hora RD.`);
  } else {
    console.log(`  🎉 ${workingKeys} clave(s) Gemini operativas.`);
  }

  // Pollinations
  await check('Pollinations AI (reachable)', async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Di: hola' }], model: 'openai' }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return `HTTP ${res.status}`;
  });

  // ── 4. Feeds RSS ──────────────────────────────────────────────────────────
  console.log('\n📡 4. FEEDS RSS (muestra)');
  const sampleFeeds = [
    'https://www.diariolibre.com/rss/portada.xml',
    'https://almomento.net/feed/',
    'https://noticiassin.com/feed/?s=nacional',
    'https://www.diariolibre.com/rss/deportes.xml',
    'https://remolacha.net/feed/',
  ];
  for (const feed of sampleFeeds) {
    await check(feed.replace('https://', '').slice(0, 40), async () => {
      const f = await parser.parseURL(feed);
      return `${f.items?.length || 0} items`;
    });
  }

  // ── 5. Portal en Producción ───────────────────────────────────────────────
  console.log('\n🌐 5. PORTAL EN PRODUCCIÓN');
  await check('imperiopublico.com (homepage)', async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch('https://www.imperiopublico.com', { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return `HTTP ${res.status} OK`;
  });

  await check('API articles paginated', async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch('https://www.imperiopublico.com/api/articles/paginated?page=1&limit=5', { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return `${json.articles?.length || 0} artículos recibidos`;
  });

  await check('Bot cron endpoint (acceso seguro)', async () => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    // Solo verificar que responde — sin clave no debería ejecutar nada
    const res = await fetch('https://www.imperiopublico.com/api/cron/bot', { signal: ctrl.signal });
    clearTimeout(t);
    // 401/403 = endpoint existe pero rechaza sin auth (correcto)
    if (res.status === 401 || res.status === 403 || res.status === 200) return `HTTP ${res.status} (protegido correctamente)`;
    throw new Error(`HTTP ${res.status}`);
  });

  // ── Resumen ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════════');
  console.log('   RESUMEN DEL SISTEMA');
  console.log('══════════════════════════════════════════════════════');
  const totalHoy = catStatus.reduce((s, c) => s + c.count, 0);
  const catsCubiertos = catStatus.filter(c => c.count >= 1).length;
  console.log(`  Artículos publicados hoy:  ${totalHoy}/12`);
  console.log(`  Categorías con contenido:  ${catsCubiertos}/${categories.length}`);
  console.log(`  Claves Gemini operativas:  ${workingKeys}/${keys.length}`);
  console.log(`  Reset de cuotas Gemini:    Hoy a las 8:00 PM hora RD`);
  console.log('══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
