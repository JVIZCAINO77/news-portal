/**
 * cleanup-duplicates.js  v2
 * Detecta y elimina artículos que cubren el mismo evento.
 *
 * MEJORA v2: Lista de entidades genéricas excluidas de la Capa 4
 * para evitar falsos positivos como "República Dominicana" o "Estados Unidos".
 *
 * Criterio de eliminación: se mantiene el artículo con más contenido.
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Entidades demasiado genéricas para discriminar eventos ───────────────────
// Si solo comparten estas palabras NO son el mismo evento.
const GENERIC_ENTITIES = new Set([
  'republica', 'dominicana', 'dominicano', 'dominicanos', 'dominicanas',
  'estados', 'unidos', 'eeuu', 'eeuuu', 'america', 'americana',
  'mundo', 'pais', 'paises', 'gobierno', 'presidente', 'nacional',
  'nueva', 'nuevo', 'gran', 'grandes', 'primer', 'primera',
  'santo', 'domingo', 'santiago', 'haiti', 'haitiano',
  'enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre',
]);

const STOP_WORDS = new Set([
  'el','la','los','las','un','una','de','del','al','a','en','y','e','o','que','por',
  'para','con','sin','sobre','entre','se','le','lo','su','sus','es','son','ha','han',
  'fue','era','ser','estar','tiene','hay','como','pero','mas','ya','si','no','ni',
]);

function extractKeywords(title) {
  if (!title) return new Set();
  const n = title.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
  return new Set(n.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)));
}

function semanticOverlap(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  const inter = [...setA].filter(k => setB.has(k)).length;
  return inter / new Set([...setA, ...setB]).size;
}

function extractEntities(title) {
  if (!title) return new Set();
  const entities = new Set();
  for (const w of title.split(/\s+/)) {
    const clean = w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    if (clean.length >= 4 && /^[A-ZÁÉÍÓÚÑ]/.test(clean)) {
      const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      // Excluir entidades genéricas
      if (!GENERIC_ENTITIES.has(norm)) {
        entities.add(norm);
      }
    }
  }
  return entities;
}

function sharesCriticalEntities(titleA, titleB) {
  const entA = extractEntities(titleA);
  const entB = extractEntities(titleB);
  if (entA.size === 0 || entB.size === 0) return false;
  const shared = [...entA].filter(e => entB.has(e));
  // Necesita 2+ entidades NO-genéricas en común
  return shared.length >= 2;
}

function normTitle(t) {
  return (t || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function areDuplicates(a, b) {
  // Capa 1: link exacto
  if (a.source_link && b.source_link && a.source_link === b.source_link)
    return { yes: true, reason: 'link exacto' };

  // Capa 2: título normalizado exacto
  if (normTitle(a.title) === normTitle(b.title))
    return { yes: true, reason: 'titulo exacto' };

  // Capa 3: Jaccard >= 30% (un poco más estricto para limpieza manual)
  const kwA = extractKeywords(a.title);
  const kwB = extractKeywords(b.title);
  const overlap = semanticOverlap(kwA, kwB);
  if (overlap >= 0.30)
    return { yes: true, reason: `Jaccard ${Math.round(overlap * 100)}%` };

  // Capa 4: entidades nombradas significativas compartidas (2+, excluyendo genéricas)
  if (sharesCriticalEntities(a.title, b.title))
    return { yes: true, reason: 'entidades especificas compartidas' };

  return { yes: false };
}

(async () => {
  console.log('🔍 Cargando artículos de los últimos 7 días...');

  const since = new Date();
  since.setDate(since.getDate() - 7);

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, category, source_link, content, publishedAt, views')
    .gte('publishedAt', since.toISOString())
    .order('publishedAt', { ascending: false });

  if (error) { console.error('Error BD:', error.message); process.exit(1); }
  console.log(`📚 ${articles.length} artículos cargados.\n`);

  const toDelete = new Set();
  const pairs = [];

  for (let i = 0; i < articles.length; i++) {
    if (toDelete.has(articles[i].id)) continue;
    for (let j = i + 1; j < articles.length; j++) {
      if (toDelete.has(articles[j].id)) continue;

      const dup = areDuplicates(articles[i], articles[j]);
      if (!dup.yes) continue;

      // Mantener el que tiene más contenido
      const lenI = (articles[i].content || '').length;
      const lenJ = (articles[j].content || '').length;
      const keep   = lenI >= lenJ ? articles[i] : articles[j];
      const remove = lenI >= lenJ ? articles[j] : articles[i];

      toDelete.add(remove.id);
      pairs.push({ reason: dup.reason, keep, remove });
    }
  }

  console.log(`⚠️  Pares duplicados encontrados: ${pairs.length}`);

  if (pairs.length === 0) {
    console.log('✅ La BD está limpia — no hay duplicados temáticos.');
    return;
  }

  console.log('\n--- DUPLICADOS DETECTADOS ---');
  pairs.forEach(({ reason, keep, remove }, idx) => {
    console.log(`\n[${idx + 1}] Razón: ${reason}`);
    console.log(`  ✅ MANTENER [${keep.category}] ${keep.title.slice(0, 65)}`);
    console.log(`              ${keep.publishedAt.slice(0, 16)} | ${(keep.content||'').length} chars`);
    console.log(`  🗑️  BORRAR  [${remove.category}] ${remove.title.slice(0, 65)}`);
    console.log(`              ${remove.publishedAt.slice(0, 16)} | ${(remove.content||'').length} chars`);
  });

  console.log(`\n🗑️  Eliminando ${toDelete.size} artículos duplicados...`);

  let deleted = 0, failed = 0;
  for (const id of toDelete) {
    const { error: delErr } = await supabase.from('articles').delete().eq('id', id);
    const art = articles.find(a => a.id === id);
    if (delErr) {
      console.error(`  ❌ Error [${art?.category}] "${art?.title?.slice(0, 50)}": ${delErr.message}`);
      failed++;
    } else {
      console.log(`  🗑️  [${art.category}] "${art.title.slice(0, 55)}"`);
      deleted++;
    }
  }

  console.log(`\n✅ Limpieza finalizada: ${deleted} eliminados, ${failed} errores.`);
})().catch(console.error);
