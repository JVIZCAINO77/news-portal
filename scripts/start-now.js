// PRIORIDAD: noticias (Nacional) va PRIMERO — es la sección más importante del portal
const categories = ['noticias', 'politica', 'sucesos', 'policia', 'deportes', 'economia', 'entretenimiento', 'tecnologia', 'tendencias', 'internacional', 'salud', 'cultura'];

async function triggerBots() {
  console.log("🚀 Iniciando oleada de publicación masiva (anti-repetición activado)...");
  for (const cat of categories) {
    try {
      console.log(`\n⏳ Ejecutando agente para: ${cat}...`);
      const url = `https://www.imperiopublico.com/api/cron/bot?category=${cat}`;
      const response = await fetch(url, { headers: { 'X-Manual-Trigger': 'true' } });
      const data = await response.json();
      if (response.ok) {
        console.log(`✅ ¡Éxito en ${cat}! ->`, data.message);
        if (data.article) {
          console.log(`   📝 Titulo: ${data.article.title}`);
        }
      } else {
        console.log(`⚠️ Advertencia en ${cat}:`, data.error || data.message);
      }
    } catch (e) {
      console.error(`❌ Error en ${cat}: ${e.message}`);
    }
    
    console.log("⏱️ Esperando 65 segundos (Evitando límite de la IA Gemini)...");
    await new Promise(resolve => setTimeout(resolve, 65000));
  }
  console.log("\n🎉 ¡Todos los agentes han publicado sus noticias iniciales!");
}

triggerBots();
