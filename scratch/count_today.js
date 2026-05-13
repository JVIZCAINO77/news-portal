const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function countTodayArticles() {
  const todayDR = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());

  const startOfToday = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
  const endOfToday = new Date(`${todayDR}T23:59:59-04:00`).toISOString();

  // Contar total del día
  const { count: totalToday, error } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('publishedAt', startOfToday)
    .lte('publishedAt', endOfToday);

  if (error) {
    console.error('Error al contar en base de datos:', error);
    process.exit(1);
  }

  // Obtener todos los artículos de hoy para desglose por categoría
  const { data: articlesToday } = await supabase
    .from('articles')
    .select('category, title, publishedAt')
    .gte('publishedAt', startOfToday)
    .lte('publishedAt', endOfToday)
    .order('publishedAt', { ascending: false });

  const byCategory = {};
  if (articlesToday) {
    articlesToday.forEach(a => {
      byCategory[a.category] = (byCategory[a.category] || 0) + 1;
    });
  }

  console.log(`\n📊 === ESTADO DE PUBLICACIONES DE HOY (${todayDR}) ===`);
  console.log(`Artículos publicados hoy en total: ${totalToday} / 12 (Límite Global AdSense)`);
  console.log(`\nDesglose por categoría:`);
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(` - ${cat.toUpperCase()}: ${count} artículo(s)`);
  }

  if (articlesToday && articlesToday.length > 0) {
    console.log(`\nÚltimos artículos publicados hoy:`);
    articlesToday.slice(0, 5).forEach((a, i) => {
      const time = new Date(a.publishedAt).toLocaleTimeString('es-DO', { timeZone: 'America/Santo_Domingo' });
      console.log(` ${i + 1}. [${time}] [${a.category.toUpperCase()}] ${a.title}`);
    });
  } else {
    console.log(`\nNo se ha publicado ningún artículo el día de hoy todavía.`);
  }
}

countTodayArticles();
