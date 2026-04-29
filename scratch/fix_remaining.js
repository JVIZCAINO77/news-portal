/**
 * fix_remaining.js — Corrige artículos específicos detectados en revisión manual
 * Uso: node scratch/fix_remaining.js
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lista de correcciones detectadas en revisión visual manual
// [fragmento del título, categoría correcta, autor correcto]
const MANUAL_FIXES = [
  // ── DEPORTES tenía artículos de otras secciones ──
  ['Capturan al cerebro tras suceso letal en el Cauca',      'sucesos',        'Redacción de Sucesos'],
  ['Hegseth en el Congreso',                                  'internacional',  'Redacción Internacional'],
  ['Bustinduy rebaja el choque con el PSOE',                  'politica',       'Mesa Política'],
  ['Israel exige evacuaciones en el sur libanés',             'internacional',  'Redacción Internacional'],
  ['Manny Cruz logra su primer disco oro',                    'entretenimiento','Sección Espectáculos'],

  // ── ENTRETENIMIENTO tenía artículos de política ──
  ['Aldama confirma que Koldo y Ábalos querían constructoras','politica',       'Mesa Política'],
  ['Torres ataja al PP',                                      'politica',       'Mesa Política'],

  // ── CULTURA tenía noticias de clima e internacional ──
  ['Alerta amarilla sube a 11 provincias',                    'noticias',       'Redacción Central'],
  ['Trump denuncia \'colapso\' en Irán y pide a Washington',  'internacional',  'Redacción Internacional'],
  ['Alerta climática: 12 provincias dominicanas cautelosas',  'noticias',       'Redacción Central'],

  // ── TECNOLOGÍA tenía artículos de noticias, política y tendencias ──
  ['Alerta amarilla en 14 provincias y Distrito Nacional',    'noticias',       'Redacción Central'],
  ['Cámara de Cuentas manda 50 expedientes a la Pepca',       'politica',       'Mesa Política'],
  ['El hombre con ensalada que se volvió viral durante el tiroteo', 'tendencias','Mesa de Tendencias'],

  // ── OPINIÓN tenía artículos de internacional, sucesos y entretenimiento ──
  ['Ginebra alerta: más de 4.000 detenidos y 21 ejecuciones en Irán', 'internacional', 'Redacción Internacional'],
  ['El Moro dominicano revelado: espaguetis con pollo',       'tendencias',     'Mesa de Tendencias'],
  ['Familia del sargento resultó ante la muerte',             'sucesos',        'Redacción de Sucesos'],
  ['Conjunto Quisqueya revoluciona el merengue',              'entretenimiento','Sección Espectáculos'],
  ['Choque de trenes en Indonesia: 15 muertos',               'internacional',  'Redacción Internacional'],
];

async function fixRemaining() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CORRECCIÓN MANUAL — Artículos detectados en revisión visual');
  console.log('═══════════════════════════════════════════════════════\n');

  let fixed = 0;
  let notFound = 0;

  for (const [titleFragment, newCategory, newAuthor] of MANUAL_FIXES) {
    // Buscar el artículo por fragmento de título (case-insensitive)
    const { data: matches, error } = await supabase
      .from('articles')
      .select('id, title, category')
      .ilike('title', `%${titleFragment}%`)
      .limit(1);

    if (error) {
      console.error(`  ✗ Error buscando "${titleFragment}": ${error.message}`);
      continue;
    }

    if (!matches || matches.length === 0) {
      console.log(`  ⚠ No encontrado: "${titleFragment.slice(0, 60)}"`);
      notFound++;
      continue;
    }

    const article = matches[0];

    // Si ya está en la sección correcta, no tocar
    if (article.category === newCategory) {
      console.log(`  ✓ Ya correcto [${newCategory.toUpperCase()}]: "${article.title.slice(0, 60)}"`);
      fixed++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('articles')
      .update({ category: newCategory, author: newAuthor })
      .eq('id', article.id);

    if (updateError) {
      console.error(`  ✗ Error actualizando [${article.id}]: ${updateError.message}`);
    } else {
      console.log(`  ✓ "${article.title.slice(0, 60)}"`);
      console.log(`    ${article.category.toUpperCase()} → ${newCategory.toUpperCase()}`);
      fixed++;
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════`);
  console.log(`  Corregidos: ${fixed}   No encontrados: ${notFound}`);
  console.log(`═══════════════════════════════════════════════════════\n`);

  // Distribución final
  const { data: all } = await supabase.from('articles').select('category');
  const counts = {};
  all.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1; });
  console.log('📊 Distribución final:');
  Object.entries(counts).sort((a, b) => b[1] - a[1])
    .forEach(([cat, c]) => console.log(`   ${cat.padEnd(18)} ${String(c).padStart(3)} artículos`));
}

fixRemaining().catch(err => { console.error('Error:', err); process.exit(1); });
