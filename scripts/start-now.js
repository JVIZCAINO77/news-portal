const categories = ['noticias', 'entretenimiento', 'deportes', 'tecnologia', 'economia', 'sucesos', 'tendencias', 'politica', 'internacional'];

async function triggerBots() {
  console.log("🚀 Iniciando oleada de publicación masiva (anti-repetición activado)...");
  for (const cat of categories) {
    try {
      console.log(`\n⏳ Ejecutando agente para: ${cat}...`);
      const url = `https://news-portal-rosy-kappa.vercel.app/api/cron/bot?category=${cat}`;
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
