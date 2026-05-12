require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Test API correct params
  console.log('🔗 Probando API con parámetros correctos...');
  try {
    const res = await fetch('https://www.imperiopublico.com/api/articles/paginated?limit=5&offset=0');
    const json = await res.json();
    const count = Array.isArray(json) ? json.length : (json.articles?.length || json.data?.length || 0);
    console.log(`  ✅ API /api/articles/paginated?limit=5&offset=0 → ${count} artículos`);
    if (Array.isArray(json) && json[0]) {
      console.log(`     Primer artículo: "${json[0].title?.slice(0, 60)}"`);
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }

  // Check all articles directly
  const { data, error } = await supabase.from('articles')
    .select('id, title, category, publishedAt, featured, trending, source_link, content')
    .order('publishedAt', { ascending: false })
    .limit(10);

  if (error) { console.log('❌ Supabase error:', error.message); return; }

  console.log(`\n📰 Últimos 10 artículos en BD:`);
  for (const a of (data || [])) {
    const date = new Date(a.publishedAt).toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });
    const contentLen = (a.content || '').length;
    const hasSourceLink = !!a.source_link;
    // Detect RSS-direct content (safety check)
    const hasRawContent = (a.content || '').includes('*Fuente original:') || 
                          (a.content || '').includes('Relevancia para los dominicanos') ||
                          (a.content || '').includes('Manténgase informado');
    const flag = hasRawContent ? '⚠️ CRUDO' : '✅';
    console.log(`  ${flag} [${a.category.padEnd(14)}] ${a.title?.slice(0, 55)} (${contentLen} chars, ${date})`);
  }

  // Integrity check: content length
  const { data: shortContent } = await supabase.from('articles')
    .select('id, title, category, content')
    .lt('content', '1200');
  // Note: can't filter by string length in supabase directly, do it in JS
  const { data: allRecent } = await supabase.from('articles')
    .select('id, title, content, category, publishedAt')
    .order('publishedAt', { ascending: false })
    .limit(100);
  
  const tooShort = (allRecent || []).filter(a => (a.content || '').length < 1200);
  const rawRss   = (allRecent || []).filter(a =>
    (a.content || '').includes('Relevancia para los dominicanos') ||
    (a.content || '').includes('*Fuente original:')
  );

  console.log(`\n🛡️  Integridad de contenido (últimos 100 artículos):`);
  console.log(`  Artículos con contenido corto (<1200 chars): ${tooShort.length}`);
  console.log(`  Artículos RSS sin reescribir detectados:     ${rawRss.length}`);
  if (rawRss.length > 0) {
    console.log('  ⚠️  ACCIÓN REQUERIDA: hay artículos sin reescribir en la BD:');
    for (const a of rawRss) {
      console.log(`     - [${a.category}] ${a.title?.slice(0, 60)} (${new Date(a.publishedAt).toLocaleDateString()})`);
    }
  } else {
    console.log('  ✅ Sin artículos crudos detectados en los últimos 100.');
  }
}

main().catch(console.error);
