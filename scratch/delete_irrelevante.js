const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteIrrelevante() {
  // Buscar artículos cuyo título sea "IRRELEVANTE" (case-insensitive)
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, category, publishedAt')
    .ilike('title', 'irrelevante');

  if (error) {
    console.error('Error buscando artículos:', error);
    return;
  }

  if (data.length === 0) {
    console.log('✅ No se encontraron artículos con título IRRELEVANTE.');
    return;
  }

  console.log(`🔍 Encontrados ${data.length} artículo(s) con título IRRELEVANTE:`);
  data.forEach(a => console.log(`  - [${a.id}] "${a.title}" | ${a.category} | ${a.publishedAt}`));

  const ids = data.map(a => a.id);
  const { error: deleteError } = await supabase
    .from('articles')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('❌ Error al eliminar:', deleteError);
  } else {
    console.log(`🗑️  ${ids.length} artículo(s) eliminado(s) correctamente.`);
  }
}

deleteIrrelevante();
