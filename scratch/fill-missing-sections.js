/**
 * fill-missing-sections.js
 * Dispara el bot SOLO para las secciones que aún no tienen artículo hoy.
 * Usa la URL de producción correcta.
 */
require('dotenv').config({ path: '.env.local' });

// Secciones que faltan hoy (verificadas manualmente antes de correr este script)
const MISSING = ['policia', 'deportes', 'sucesos', 'entretenimiento', 'economia', 'cultura', 'noticias'];
const PROD_URL = 'https://www.imperiopublico.com';

async function triggerSection(cat) {
  const url = `${PROD_URL}/api/cron/bot?category=${cat}`;
  console.log(`\n⏳ [${cat.toUpperCase()}] Disparando...`);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'X-Manual-Trigger': 'true' },
    });
    const data = await res.json();
    if (data.article) {
      console.log(`  ✅ PUBLICADO: "${data.article.title}"`);
    } else if (data.message) {
      console.log(`  ℹ️  ${data.message}`);
    } else {
      console.log(`  ⚠️  Respuesta:`, JSON.stringify(data).slice(0, 120));
    }
  } catch (e) {
    console.error(`  ❌ Error de red: ${e.message}`);
  }
}

(async () => {
  console.log('🚀 Completando secciones faltantes del día...');
  console.log(`📋 Secciones: ${MISSING.join(', ')}\n`);

  for (const cat of MISSING) {
    await triggerSection(cat);
    if (MISSING.indexOf(cat) < MISSING.length - 1) {
      console.log('  ⏱️  Esperando 30s antes de la siguiente sección...');
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  console.log('\n\n🎉 ¡Proceso completado!');
})();
