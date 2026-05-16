/**
 * patch-dedup.js
 * Aplica el fix de deduplicacion global a publish-now.js
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'scripts', 'publish-now.js');
let src = fs.readFileSync(filePath, 'utf8');

// ── FIX 1: Firma de processCategory ──────────────────────────────────────────
// Agrega los 7 parametros del estado global de dedup
const oldSig = 'async function processCategory(catKey) {';
const newSig = 'async function processCategory(catKey, todayDR, startOfToday, endOfToday, publishedLinks, publishedKeywordSets, publishedTitles) {';
if (src.includes(oldSig)) {
  src = src.replace(oldSig, newSig);
  console.log('✅ FIX 1: Firma de processCategory actualizada');
} else {
  console.log('⚠️  FIX 1: Firma ya actualizada o no encontrada');
}

// ── FIX 2: Eliminar recalculo de todayDR dentro de processCategory ────────────
// Buscar el bloque exacto que recalcula las fechas dentro de processCategory
// y borrarlo (ya viene desde main())
const dateBlockPattern = /\n  const todayDR = new Intl\.DateTimeFormat\('en-CA'[\s\S]*?\.toISOString\(\);\n\n  \/\/ Verificar limites/;
if (dateBlockPattern.test(src)) {
  src = src.replace(dateBlockPattern, '\n\n  // Verificar limites');
  console.log('✅ FIX 2: Bloque de fechas duplicado eliminado de processCategory');
} else {
  console.log('⚠️  FIX 2: Bloque de fechas no encontrado (ya fue eliminado o formato diferente)');
}

// ── FIX 3: main() — agregar inicializacion del estado global de dedup ─────────
const oldMainLoop = `  for (const catKey of categoriesToRun) {
    await processCategory(catKey);`;

const newMainBlock = `  // Estado global de dedup: se carga UNA vez y se comparte entre TODAS las categorias.
  // Garantiza que si 'sucesos' publica sobre Guyana, 'policia' NO repite el mismo tema.
  const todayDR = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const startOfToday = new Date(todayDR + 'T00:00:00-04:00').toISOString();
  const endOfToday   = new Date(todayDR + 'T23:59:59-04:00').toISOString();

  const { data: todayInDB } = await supabase
    .from('articles').select('source_link, title')
    .gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);

  const publishedLinks       = new Set((todayInDB || []).map(a => a.source_link).filter(Boolean));
  const publishedKeywordSets = (todayInDB || []).map(a => extractKeywords(a.title)).filter(s => s.size > 0);
  const publishedTitles      = new Set(
    (todayInDB || []).map(a =>
      (a.title || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, ' ').trim()
    ).filter(Boolean)
  );

  console.log('[DEDUP] Estado inicial: ' + publishedLinks.size + ' links | ' + publishedKeywordSets.length + ' temas | ' + publishedTitles.size + ' titulos en BD hoy');

  for (const catKey of categoriesToRun) {
    await processCategory(catKey, todayDR, startOfToday, endOfToday, publishedLinks, publishedKeywordSets, publishedTitles);`;

if (src.includes(oldMainLoop)) {
  src = src.replace(oldMainLoop, newMainBlock);
  console.log('✅ FIX 3: main() actualizado con estado global de dedup');
} else {
  console.log('⚠️  FIX 3: Loop de main no encontrado — revisando...');
  // Buscar si ya fue actualizado
  if (src.includes('processCategory(catKey, todayDR')) {
    console.log('   → Ya fue actualizado previamente');
  }
}

fs.writeFileSync(filePath, src, 'utf8');
console.log('\n✅ publish-now.js guardado con el fix de deduplicacion global.');

// Verificacion final
const checks = {
  'Nueva firma': src.includes('processCategory(catKey, todayDR, startOfToday'),
  'Estado global en main': src.includes('Estado global de dedup'),
  'publishedTitles en main': src.includes('const publishedTitles'),
  'Llamada correcta en main': src.includes('processCategory(catKey, todayDR, startOfToday, endOfToday, publishedLinks'),
};
console.log('\n--- Verificacion ---');
Object.entries(checks).forEach(([k, v]) => console.log((v ? '✅' : '❌') + ' ' + k));
