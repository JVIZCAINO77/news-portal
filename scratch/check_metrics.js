const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Credenciales de Supabase no encontradas en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetrics() {
  console.log("📊 --- MÉTRICAS DE LA BASE DE DATOS --- 📊\n");

  try {
    // 1. Total de artículos
    const { count: totalArticles, error: err1 } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true });
    
    if (err1) throw err1;
    console.log(`📝 Total de artículos publicados: ${totalArticles}`);

    // 2. Artículos de hoy (Hora DR)
    const todayDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    
    const startOfTodayDR = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
    const endOfTodayDR   = new Date(`${todayDR}T23:59:59-04:00`).toISOString();

    const { count: todayArticles, error: err2 } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .gte('publishedAt', startOfTodayDR)
      .lte('publishedAt', endOfTodayDR);

    if (err2) throw err2;
    console.log(`📅 Artículos generados HOY (${todayDR}): ${todayArticles}`);

    // 3. Distribución por categorías
    const { data: categoryData, error: err3 } = await supabase
      .from('articles')
      .select('category');
    
    if (err3) throw err3;

    const categoryCounts = categoryData.reduce((acc, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n📂 Distribución por Categorías:`);
    for (const [cat, count] of Object.entries(categoryCounts).sort((a,b) => b[1]-a[1])) {
      console.log(`   - ${cat.toUpperCase()}: ${count}`);
    }

    // 4. Estado de la automatización
    const { data: botSetting, error: err4 } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'automation_enabled')
      .maybeSingle();
      
    if (err4) throw err4;
    console.log(`\n🤖 Estado del Bot: ${botSetting?.value ? '🟢 ACTIVADO' : '🔴 PAUSADO'}`);
    
    // 5. Últimas 3 noticias publicadas
    const { data: latest, error: err5 } = await supabase
      .from('articles')
      .select('title, category, publishedAt')
      .order('publishedAt', { ascending: false })
      .limit(3);
      
    if (err5) throw err5;
    console.log(`\n📰 Últimas 3 noticias publicadas:`);
    latest.forEach(art => {
      const dateObj = new Date(art.publishedAt);
      const timeStr = dateObj.toLocaleTimeString('es-DO', { timeZone: 'America/Santo_Domingo' });
      console.log(`   - [${timeStr}] [${art.category.toUpperCase()}] ${art.title}`);
    });

  } catch (error) {
    console.error("Error obteniendo métricas:", error.message);
  }
}

checkMetrics();
