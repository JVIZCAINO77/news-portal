const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const todayDR = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const startOfToday = new Date(todayDR + 'T00:00:00-04:00').toISOString();
  const endOfToday   = new Date(todayDR + 'T23:59:59-04:00').toISOString();

  console.log(`Buscando artículos publicados hoy (${todayDR}) en la zona horaria de Santo Domingo...`);
  console.log(`Rango UTC: ${startOfToday} hasta ${endOfToday}\n`);

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, category, publishedAt, slug')
    .gte('publishedAt', startOfToday)
    .lte('publishedAt', endOfToday)
    .order('publishedAt', { ascending: true });

  if (error) {
    console.error('Error al consultar los artículos:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No se encontraron artículos publicados hoy.');
  } else {
    console.log(`Se encontraron ${data.length} artículos publicados hoy:\n`);
    data.forEach((art, index) => {
      const pubDate = new Date(art.publishedAt);
      const timeStr = pubDate.toLocaleTimeString('es-DO', {
        timeZone: 'America/Santo_Domingo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      console.log(`${index + 1}. [${timeStr}] [${art.category.toUpperCase()}] ${art.title}`);
      console.log(`   Slug: ${art.slug}`);
    });
  }

  console.log('\n--- Resumen por categorías ---');
  // Categorías que se manejan en el sistema:
  const allCategories = ['nacional', 'politica', 'policia', 'deportes', 'economia', 'sucesos', 'internacional', 'entretenimiento', 'cultura', 'tecnologia', 'salud', 'medio-ambiente'];
  const publishedCats = data ? data.map(a => a.category.toLowerCase()) : [];
  
  allCategories.forEach(cat => {
    const count = publishedCats.filter(c => c === cat).length;
    console.log(`- ${cat.toUpperCase()}: ${count > 0 ? `✅ Publicado (${count})` : '❌ Faltante'}`);
  });
}

main().catch(console.error);
