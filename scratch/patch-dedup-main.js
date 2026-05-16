/**
 * patch-dedup-main.js  
 * Reemplaza el bloque main() en publish-now.js con la version correcta
 * que inicializa el estado global de dedup y lo pasa a todas las categorias.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'scripts', 'publish-now.js');
let src = fs.readFileSync(filePath, 'utf8');

// Encontrar inicio y fin del main() para reemplazarlo completo
const mainStart = src.indexOf('// ─── MAIN ─────────────────────────────────────────────────────────────────────');
if (mainStart === -1) {
  // Intentar otra forma
  const alt = src.indexOf('async function main() {');
  if (alt === -1) { console.error('No se encontro main()'); process.exit(1); }
}

// Reemplazar todo desde el comentario MAIN hasta el final
const mainIdx = src.indexOf('// ─── MAIN');
if (mainIdx === -1) {
  console.error('Marcador // ─── MAIN no encontrado');
  process.exit(1);
}

const newMain = `// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const categoriesToRun = args.length > 0 ? args : Object.keys(CATEGORIES);

  console.log('Imperio Publico - Publicacion Manual de Noticias');
  console.log(new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' }));
  console.log('Categorias: ' + categoriesToRun.join(', ') + '\\n');

  // ── ESTADO GLOBAL DE DEDUP ────────────────────────────────────────────────────
  // Se carga UNA SOLA VEZ desde la BD y se comparte entre TODAS las categorias.
  // Si 'sucesos' publica sobre Guyana, 'policia' NO puede publicar el mismo tema.
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
      (a.title || '').toLowerCase().normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '').replace(/\\s+/g, ' ').trim()
    ).filter(Boolean)
  );

  console.log('[DEDUP] Estado inicial: ' +
    publishedLinks.size + ' links | ' +
    publishedKeywordSets.length + ' temas | ' +
    publishedTitles.size + ' titulos ya publicados hoy');

  for (const catKey of categoriesToRun) {
    await processCategory(
      catKey, todayDR, startOfToday, endOfToday,
      publishedLinks, publishedKeywordSets, publishedTitles
    );
    if (categoriesToRun.length > 1) {
      console.log('\\nEsperando 5 segundos antes de la siguiente categoria...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\\n\\nProceso completado!');
}

main().catch(console.error);
`;

src = src.slice(0, mainIdx) + newMain;
fs.writeFileSync(filePath, src, 'utf8');

// Verificacion
const checks = {
  'publishedTitles inicializado': src.includes('const publishedTitles'),
  'Llamada correcta a processCategory': src.includes('processCategory(\n      catKey, todayDR'),
  'Estado inicial loggeado': src.includes('[DEDUP] Estado inicial'),
  'No llama con 1 solo arg': !src.includes('processCategory(catKey);'),
};
console.log('--- Verificacion ---');
Object.entries(checks).forEach(([k, v]) => console.log((v ? 'OK' : 'FALLO') + ': ' + k));
console.log('\npublish-now.js actualizado correctamente.');
