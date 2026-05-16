// PRIORIDAD: 10 secciones NACIONALES primero → luego 2 secciones globales.
// Ritmo: 1 artículo cada 30 minutos — natural para lectores y para Google News.
require('dotenv').config({ path: '.env.local' });

const categories = [
  // ─── SECCIONES NACIONALES (10) ──────────────────────────────────
  'noticias',        // General nacional
  'politica',        // Política dominicana
  'sucesos',         // Sucesos nacionales
  'policia',         // Policíal / judicial
  'deportes',        // Deportes (RD-centrado)
  'economia',        // Economía nacional
  'entretenimiento', // Espectáculos / farándula
  'cultura',         // Cultura dominicana
  'salud',           // Salud pública
  'tendencias',      // Tendencias / viral
  // ─── SECCIONES GLOBALES (2) ───────────────────────────────────
  'tecnologia',      // Tecnología / IA (alcance mundial)
  'internacional',   // Solo noticias de alto impacto mundial
];

// ⏱️ 30 minutos entre cada artículo — ritmo editorial natural
const PAUSE_MS = 30 * 60 * 1000;

async function triggerBots() {
  const total  = categories.length;
  const durMin = total * 30; // minutos totales
  console.log(`🚀 Iniciando publicación (${total} secciones, 1 cada 30 min)`);
  console.log(`⏱️  Duración estimada: ${Math.floor(durMin / 60)}h ${durMin % 60}min\n`);

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const now = new Date().toLocaleTimeString('es-DO', {
      timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit'
    });
    console.log(`\n[${i + 1}/${total}] ⏳ [${now} RD] Publicando: ${cat.toUpperCase()}...`);

    try {
      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 58000);

      const response = await fetch(
        `https://www.imperiopublico.com/api/cron/bot?category=${cat}`,
        {
          headers: {
            'X-Manual-Trigger': 'true',
            'Authorization': `Bearer ${process.env.CRON_SECRET || ''}`,
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);

      const data = await response.json();
      if (response.ok) {
        const published = data.message?.includes('publicada');
        console.log(
          published
            ? `✅ Publicado! → ${data.article?.title?.slice(0, 65) || ''}`
            : `ℹ️  ${data.message?.slice(0, 100)}`
        );
      } else {
        console.log(`⚠️  ${data.error || data.message}`);
      }
    } catch (e) {
      console.error(e.name === 'AbortError'
        ? `⏱️  Timeout en ${cat} (>58s) — continuando`
        : `❌ Error en ${cat}: ${e.message}`
      );
    }

    // Pausa de 30 minutos antes del siguiente (no después del último)
    if (i < categories.length - 1) {
      const nextTime = new Date(Date.now() + PAUSE_MS).toLocaleTimeString('es-DO', {
        timeZone: 'America/Santo_Domingo', hour: '2-digit', minute: '2-digit'
      });
      console.log(`⏸️  Próximo (${categories[i + 1]}) a las [${nextTime} RD]`);
      await new Promise(r => setTimeout(r, PAUSE_MS));
    }
  }

  console.log('\n🎉 Ciclo completo — 12 artículos publicados a lo largo del día.');
}

triggerBots();
