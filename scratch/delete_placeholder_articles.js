/**
 * Encuentra y elimina artículos placeholder/basura de la base de datos.
 * Detecta artículos cuyo contenido es texto de plantilla o de ejemplo del prompt.
 * 
 * Uso: node scratch/delete_placeholder_articles.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Patrones que delatan un artículo placeholder / mal generado
const PLACEHOLDER_PATTERNS = [
  'titular real aquí',
  'gancho real aquí',
  'artículo real en markdown',
  'titular llamativo',
  'magnético aquí',
  'artículo completo',
  'gancho periodístico',
  'resumen en forma de',
  'seo1', 'seo2', 'seo3',
  '<titular', '<excerpt', '<contenido', '<tag',
];

const normalizeForCheck = (str) => 
  String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

async function main() {
  console.log('\n🔍 Buscando artículos placeholder en la base de datos...\n');

  // Traer todos los artículos recientes (últimas 72h) para revisarlos
  const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, excerpt, content, publishedAt')
    .gte('publishedAt', since)
    .order('publishedAt', { ascending: false });

  if (error) {
    console.error('❌ Error al consultar BD:', error.message);
    process.exit(1);
  }

  console.log(`  Total artículos recientes (72h): ${articles.length}`);

  const toDelete = [];

  for (const art of articles) {
    const combined = normalizeForCheck(`${art.title} ${art.excerpt} ${art.content} ${(art.tags || []).join(' ')}`);
    const isPlaceholder = PLACEHOLDER_PATTERNS.some(pattern =>
      combined.includes(normalizeForCheck(pattern))
    );

    if (isPlaceholder) {
      toDelete.push(art);
      console.log(`  🗑  [PLACEHOLDER] ID ${art.id} — "${art.title?.slice(0, 80)}"`);
    }
  }

  if (toDelete.length === 0) {
    console.log('\n✅ No se encontraron artículos placeholder. Base de datos limpia.\n');
    return;
  }

  console.log(`\n⚠️  Se encontraron ${toDelete.length} artículos para eliminar.`);
  console.log('   Eliminando...\n');

  for (const art of toDelete) {
    const { error: delErr } = await supabase
      .from('articles')
      .delete()
      .eq('id', art.id);

    if (delErr) {
      console.error(`  ❌ Error al eliminar ID ${art.id}:`, delErr.message);
    } else {
      console.log(`  ✅ Eliminado: ID ${art.id} — "${art.title?.slice(0, 60)}"`);
    }
  }

  console.log('\n🎉 Limpieza completada.\n');
}

main().catch(err => {
  console.error('\n❌ ERROR FATAL:', err.message);
  process.exit(1);
});
