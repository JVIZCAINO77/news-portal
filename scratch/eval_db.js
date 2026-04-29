const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function evaluateState() {
  console.log("--- Evaluación del Portal ---");
  
  // 1. Total de artículos
  const { count: totalArticles } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });
  console.log(`Total de artículos publicados: ${totalArticles}`);

  // 2. Últimos 5 artículos
  console.log("\n--- Últimos 5 artículos publicados ---");
  const { data: latestArticles, error: errLatest } = await supabase
    .from('articles')
    .select('id, title, category, author, publishedAt, owner, image')
    .order('publishedAt', { ascending: false })
    .limit(5);
    
  if (errLatest) {
    console.error("Error fetching latest articles:", errLatest);
  } else {
    latestArticles.forEach((a, i) => {
      console.log(`${i+1}. ${a.title}`);
      console.log(`   - Categoría: ${a.category}`);
      console.log(`   - Autor/Agente: ${a.author || a.owner || 'N/A'}`);
      console.log(`   - Fecha: ${new Date(a.publishedAt).toLocaleString()}`);
      console.log(`   - Imagen: ${a.image ? (a.image.length > 50 ? a.image.substring(0, 50) + '...' : a.image) : 'NO IMAGE'}`);
    });
  }

  // 3. Revisar si hay artículos placeholder (Lorem ipsum)
  console.log("\n--- Verificación de Placeholders ---");
  const { data: placeholders, error: errPlaceholder } = await supabase
    .from('articles')
    .select('id, title')
    .or('content.ilike.%lorem ipsum%,title.ilike.%lorem ipsum%,title.ilike.%test%,title.ilike.%prueba%');
    
  if (placeholders && placeholders.length > 0) {
    console.log(`¡ATENCIÓN! Se encontraron ${placeholders.length} posibles artículos placeholder/prueba.`);
    placeholders.slice(0, 3).forEach(p => console.log(`   - [${p.id}] ${p.title}`));
  } else {
    console.log("No se encontraron artículos placeholder.");
  }

  // 4. Verificación de imágenes externas
  console.log("\n--- Verificación de Imágenes ---");
  const { data: externalImages, error: errExtImg } = await supabase
    .from('articles')
    .select('id, image')
    .not('image', 'ilike', '%cloudinary.com%')
    .not('image', 'ilike', '%pollinations.ai%')
    .not('image', 'ilike', '%/placeholder%')
    .not('image', 'is', null);

  if (externalImages) {
    console.log(`Hay ${externalImages.length} artículos con imágenes externas (posiblemente de los feeds RSS).`);
  }

  // 5. Autores o agentes activos
  console.log("\n--- Estadísticas de Autores/Agentes (Top 5) ---");
  const { data: allAuthors, error: errAllAuthors } = await supabase
    .from('articles')
    .select('author, owner');
    
  if (allAuthors && allAuthors.length > 0) {
    const authorCounts = allAuthors.reduce((acc, curr) => {
      const author = curr.author || curr.owner || 'Desconocido/RSS';
      acc[author] = (acc[author] || 0) + 1;
      return acc;
    }, {});
    
    // Convert to array and sort by count desc
    const sortedAuthors = Object.entries(authorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    for (const [author, count] of sortedAuthors) {
      console.log(`   - ${author}: ${count} artículos`);
    }
  }
}

evaluateState();
