const categories = [
  'noticias', 'entretenimiento', 'deportes', 'tecnologia', 'economia',
  'salud', 'cultura', 'opinion', 'sucesos', 'tendencias', 'internacional', 'politica'
];

async function run() {
  for (const cat of categories) {
    try {
      console.log(`Buscando noticias para categoría: ${cat}...`);
      const res = await fetch(`http://localhost:3000/api/cron/bot?category=${cat}`, {
        headers: { 'X-Manual-Trigger': 'true' }
      });
      const data = await res.json();
      console.log(`[${cat}] Response:`, data);
    } catch (err) {
      console.error(`[${cat}] Error:`, err.message);
    }
  }
}

run();
