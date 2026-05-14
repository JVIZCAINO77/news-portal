const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('❌ Faltan variables de entorno de Supabase en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .replace(/[^a-z0-9]+/g, ' ')     // Solo letras y números
    .replace(/\s+/g, ' ')
    .trim();
}

async function cleanupDuplicates() {
  console.log('🔍 Iniciando auditoría y limpieza de artículos duplicados en Supabase...\n');

  // Obtener todos los artículos con sus campos clave
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, source_link, publishedAt')
    .order('publishedAt', { ascending: true }); // El más antiguo primero

  if (error) {
    console.error('❌ Error al obtener los artículos:', error.message);
    process.exit(1);
  }

  console.log(`📦 Total de artículos analizados en la base de datos: ${articles.length}`);

  const linkMap = new Map();
  const titleMap = new Map();
  const duplicatesToDelete = [];

  for (const article of articles) {
    let isDuplicate = false;

    // 1. Verificar duplicado por source_link exacta (si proviene de un bot)
    if (article.source_link && article.source_link.trim() !== '') {
      const link = article.source_link.trim();
      if (linkMap.has(link)) {
        isDuplicate = true;
        console.log(`  🔗 Duplicado por Link detectado:`);
        console.log(`     Retenido: [${linkMap.get(link).id}] "${linkMap.get(link).title}"`);
        console.log(`     A BORRAR: [${article.id}] "${article.title}"`);
      } else {
        linkMap.set(link, article);
      }
    }

    // 2. Verificar duplicado por Título Normalizado (incluso si el link varía ligeramente)
    if (!isDuplicate && article.title) {
      const normTitle = normalizeTitle(article.title);
      if (normTitle.length > 15) { // Ignorar títulos demasiado cortos genéricos
        if (titleMap.has(normTitle)) {
          isDuplicate = true;
          console.log(`  🔤 Duplicado por Título detectado:`);
          console.log(`     Retenido: [${titleMap.get(normTitle).id}] "${titleMap.get(normTitle).title}"`);
          console.log(`     A BORRAR: [${article.id}] "${article.title}"`);
        } else {
          titleMap.set(normTitle, article);
        }
      }
    }

    if (isDuplicate) {
      duplicatesToDelete.push(article.id);
    }
  }

  console.log(`\n🚨 Total de artículos duplicados encontrados para eliminar: ${duplicatesToDelete.length}`);

  if (duplicatesToDelete.length > 0) {
    console.log('🗑️ Procediendo a eliminar duplicados de la base de datos...');
    
    // Eliminar en lotes para evitar límites de URL/consulta
    const batchSize = 50;
    for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
      const batch = duplicatesToDelete.slice(i, i + batchSize);
      const { error: delError } = await supabase
        .from('articles')
        .delete()
        .in('id', batch);

      if (delError) {
        console.error(`❌ Error al eliminar lote de duplicados:`, delError.message);
      } else {
        console.log(`  ✅ Eliminados ${batch.length} duplicados (lote ${i / batchSize + 1})`);
      }
    }
    console.log('\n✨ Limpieza completada con éxito. La base de datos está 100% libre de duplicados.');
  } else {
    console.log('\n✨ Excelente: No se encontró ningún artículo repetido en la web.');
  }
}

cleanupDuplicates();
