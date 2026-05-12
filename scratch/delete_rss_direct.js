require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanup() {
  // Buscar artículos publicados desde las 18:00 UTC de hoy que contengan la firma del RSS directo
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - 2); // últimas 2 horas

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, content, publishedAt, category')
    .gte('publishedAt', cutoff.toISOString())
    .order('publishedAt', { ascending: false });

  if (error) { console.error(error); return; }

  const toDelete = (data || []).filter(a =>
    a.content && (
      a.content.includes('*Fuente original:') ||
      a.content.includes('Relevancia para los dominicanos') ||
      a.content.includes('Manténgase informado')
    )
  );

  console.log(`Artículos publicados en las últimas 2h: ${data?.length}`);
  console.log(`Artículos sin reescribir (para eliminar): ${toDelete.length}`);
  
  if (toDelete.length === 0) {
    console.log('✅ No se encontraron artículos directos de RSS para eliminar.');
    return;
  }

  for (const art of toDelete) {
    console.log(`🗑  Eliminando [${art.category}]: "${art.title?.slice(0, 60)}"`);
    const { error: delErr } = await supabase.from('articles').delete().eq('id', art.id);
    if (delErr) console.error(`   ❌ Error: ${delErr.message}`);
    else console.log(`   ✅ Eliminado`);
  }

  console.log(`\n✅ Limpieza completada. ${toDelete.length} artículos eliminados.`);
}

cleanup().catch(console.error);
