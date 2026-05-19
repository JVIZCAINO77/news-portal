#!/usr/bin/env node
/**
 * publish-remaining.js — Publica las categorías faltantes del día, una cada 30 minutos.
 */
require('dotenv').config({ path: '.env.local' });

const SITE_URL   = process.env.NEXT_PUBLIC_SITE_URL || 'https://imperiopublico.com';
const SECRET     = process.env.CRON_SECRET;
const INTERVAL   = 30 * 60 * 1000; // 30 minutos

const categories = ['politica', 'economia', 'policia', 'salud', 'tendencias', 'nacional'];

function timestamp() {
  return new Date().toLocaleTimeString('es-DO', { timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit' });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function triggerCategory(cat) {
  const url = `${SITE_URL}/api/cron/bot?category=${cat}`;
  console.log(`\n[${timestamp()}] 🚀 Publicando: ${cat.toUpperCase()}`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SECRET}`,
        'X-Manual-Trigger': 'true',
        'X-Admin-Id': '00000000-0000-0000-0000-000000000001',
      },
      signal: AbortSignal.timeout(90000),
    });
    const json = await res.json();
    if (json.article) {
      console.log(`[${timestamp()}] ✅ Publicado: "${json.article.title?.slice(0, 70)}"`);
    } else {
      console.log(`[${timestamp()}] ℹ️  Respuesta: ${json.message || JSON.stringify(json).slice(0, 120)}`);
    }
  } catch (e) {
    console.log(`[${timestamp()}] ❌ Error en ${cat}: ${e.message}`);
  }
}

async function main() {
  console.log('════════════════════════════════════════════');
  console.log('  📰 PUBLICANDO ARTÍCULOS FALTANTES');
  console.log(`  ${categories.length} categorías — cada 30 minutos`);
  console.log('════════════════════════════════════════════');

  for (let i = 0; i < categories.length; i++) {
    await triggerCategory(categories[i]);

    if (i < categories.length - 1) {
      const next = categories[i + 1];
      console.log(`\n[${timestamp()}] ⏳ Próxima categoría: ${next.toUpperCase()} en 30 min...`);
      await sleep(INTERVAL);
    }
  }

  console.log(`\n[${timestamp()}] 🎉 ¡Todos los artículos del día publicados!`);
}

main();
