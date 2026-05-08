/**
 * reclassify-articles.mjs
 * ─────────────────────────────────────────────────────────────────
 * Detecta artículos que están en la sección equivocada y los mueve
 * a la sección correcta usando la misma lógica de ALLOWLIST/BLOCKLIST
 * del bot de publicación.
 *
 * Uso:
 *   node scripts/reclassify-articles.mjs          → solo muestra cambios (dry-run)
 *   node scripts/reclassify-articles.mjs --apply  → aplica los cambios en Supabase
 * ─────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── ALLOWLIST por categoría ──────────────────────────────────────
// Al menos UNA de estas palabras debe estar presente en el texto del artículo
// para que pertenezca a esa sección.
const ALLOWLIST = {
  deportes:       ['deporte','beisbol','béisbol','futbol','fútbol','baloncesto',
                   'nba','mlb','atleta','jugador','equipo','torneo','campeonato',
                   'liga','gol','jonron','jonrón','pitcher','pelotero','cancha',
                   'estadio','boxeo','tenis','ciclismo','medalla','atletismo',
                   'natacion','natación','voleibol','softbol','lucha','pelea'],
  economia:       ['economía','economico','económico','financiero','pib','inflación',
                   'inflacion','banco','dólar','dolar','mercado','inversión','inversion',
                   'empresa','comercio','impuesto','presupuesto','exportación','exportacion',
                   'importación','importacion','precio','costo','déficit','deficit',
                   'reservas','divisas','remesas','aranceles','arancel','banca'],
  politica:       ['política','politica','político','politico','gobierno','presidente',
                   'ministro','diputado','senador','partido','elecciones','congreso',
                   'legislación','legislacion','decreto','reforma','municipio','alcalde',
                   'gabinete','ejecutivo','legislativo','senado','cámara','camara',
                   'abinader','ayuntamiento','poder judicial','fiscal'],
  salud:          ['salud','médico','medico','médica','medica','hospital','enfermedad',
                   'vacuna','tratamiento','paciente','clínica','clinica','medicina',
                   'virus','pandemia','cáncer','cancer','diabetes','bienestar',
                   'prevención','prevencion','nutrición','nutricion','fármaco','farmaco',
                   'epidemia','sanitario','quirúrgico','quirurgico','cirugía','cirugia'],
  entretenimiento:['espectáculo','espectaculo','farándula','farandula','actor','actriz',
                   'cantante','película','pelicula','serie','concierto','artista',
                   'música','musica','teatro','show','celebridad','estreno',
                   'nominación','nominacion','premio','reggaetón','reggaeton',
                   'bachata','merengue','influencer','alofoke','reality'],
  cultura:        ['cultura','cultural','arte','museo','exposición','exposicion',
                   'patrimonio','literatura','libro','autor','escritor','festival',
                   'danza','folclore','tradición','tradicion','gastronomía','gastronomia',
                   'arquitectura','identidad','artesanía','artesania','pintora','pintor'],
  tecnologia:     ['tecnología','tecnologia','tecnológico','tecnologico',
                   'inteligencia artificial','ia','robot','app','aplicación',
                   'software','hardware','digital','internet','ciberseguridad',
                   'startup','innovación','innovacion','samsung','apple','google',
                   'meta','openai','computadora','smartphone','cohete','nasa','espacial'],
  sucesos:        ['detenido','arrestado','capturado','homicidio','asesinado','asesinato',
                   'robo','accidente','incendio','crimen','policía','policia',
                   'autoridades','investigación','investigacion','víctima','victima',
                   'sospechoso','fugitivo','delito','herido','heridos','muerto','matan',
                   'mató','mato','hallaron','cadáver','cadaver','apresado','reclusión'],
  tendencias:     ['viral','tendencia','redes sociales','tiktok','instagram','twitter',
                   'youtube','influencer','meme','trending','popular','hashtag'],
  internacional:  ['internacional','estados unidos','eeuu','europa','china','rusia',
                   'latinoamérica','latinoamerica','onu','biden','trump','guerra',
                   'conflicto','diplomacia','cumbre','tratado','extranjero','global',
                   'migración','migracion','haití','haiti','venezuela','colombia',
                   'ukraine','ucrania','israel','oriente medio'],
  opinion:        ['opinión','opinion','editorial','columna','análisis','analisis',
                   'punto de vista','perspectiva','reflexión','reflexion','debate'],
  noticias:       [], // sección general: acepta cualquier cosa no clasificable
};

// ─── BLOCKLIST por categoría ──────────────────────────────────────
const BLOCKLIST = {
  deportes:       ['homicidio','asesinado','asesinato','detenido','arrestado',
                   'inflacion','inflación','pib','banco central','ministro de'],
  economia:       ['beisbol','jonron','mlb','nba','gol','partido de futbol',
                   'actor','actriz','cantante','concierto','farandula','pitcher'],
  politica:       ['beisbol','jonron','mlb','nba','actor','actriz','cantante',
                   'concierto','farandula','gol','pitcher'],
  salud:          ['beisbol','jonron','mlb','gol','pitcher','asesinado','homicidio',
                   'partido politico'],
  entretenimiento:['pib','inflacion','banco central','homicidio','asesinado',
                   'tribunal','gol','beisbol'],
  cultura:        ['beisbol','jonron','mlb','nba','pib','inflacion','banco central',
                   'homicidio','asesinado'],
  tecnologia:     ['homicidio','asesinado','asesinato','detenido por','arrestado por',
                   'presidente abinader','senado dominicano','votos','partido politico',
                   'diputado','senador','beisbol','gol'],
  sucesos:        ['actor','actriz','cantante','concierto','beisbol','jonron',
                   'mlb','nba','pib','inflacion'],
  tendencias:     ['pib','inflacion','banco central','reforma constitucional',
                   'proyecto de ley','decreto presidencial','senado dominicano',
                   'homicidio','asesinato','partido politico'],
  internacional:  ['presidente abinader','senado dominicano','camara de diputados',
                   'ayuntamiento de','alcalde de rd','abinader'],
  opinion:        [],
  noticias:       [],
};

const CATEGORIES_ORDER = [
  'deportes','politica','economia','salud','entretenimiento',
  'cultura','tecnologia','sucesos','internacional',
];

// ─── Normaliza texto para comparación ────────────────────────────
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ─── Puntúa un texto contra una categoría ────────────────────────
// Devuelve el número de palabras del allowlist encontradas
function scoreForCategory(text, catSlug) {
  const norm = normalize(text);
  const blocklist = BLOCKLIST[catSlug] || [];
  const allowlist = ALLOWLIST[catSlug] || [];

  // Si alguna palabra del blocklist aparece → score 0
  const blocked = blocklist.some(w => norm.includes(normalize(w)));
  if (blocked) return 0;

  if (allowlist.length === 0) return 0; 

  // Contar cuántas palabras del allowlist están presentes
  return allowlist.filter(w => norm.includes(normalize(w))).length;
}

// ─── Determina la mejor categoría para un artículo ───────────────
function detectCategory(article) {
  const text = `${article.title || ''} ${article.excerpt || ''} ${article.content || ''}`;
  
  // Default fallback instead of "noticias" (using "internacional" as a generic catch-all that has good volume)
  let bestSlug = 'internacional';
  let bestScore = 0;

  for (const slug of CATEGORIES_ORDER) {
    const score = scoreForCategory(text, slug);
    if (score > bestScore) {
      bestScore = score;
      bestSlug = slug;
    }
  }

  return bestSlug;
}

// ─── MAIN ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🔍 Imperio Público — Reclasificador de Artículos`);
  console.log(`   Modo: ${APPLY ? '✏️  APLICAR CAMBIOS' : '👁  DRY-RUN (solo vista previa)'}`);
  console.log('─'.repeat(60));

  // Obtener todos los artículos (paginado de 1000 en 1000)
  let allArticles = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, excerpt, content, category')
      .range(from, from + PAGE - 1);

    if (error) {
      console.error('❌ Error al obtener artículos:', error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;
    allArticles = allArticles.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }

  console.log(`\n📰 Total de artículos analizados: ${allArticles.length}`);

  const toFix = [];

  for (const article of allArticles) {
    const detected = detectCategory(article);
    if (detected !== article.category) {
      toFix.push({
        id:       article.id,
        title:    article.title?.slice(0, 70),
        from:     article.category,
        to:       detected,
      });
    }
  }

  if (toFix.length === 0) {
    console.log('\n✅ ¡Todos los artículos están en la sección correcta! No hay nada que corregir.\n');
    return;
  }

  console.log(`\n⚠️  ${toFix.length} artículo(s) fuera de sección:\n`);
  for (const f of toFix) {
    console.log(`  [${f.from.padEnd(14)} → ${f.to.padEnd(14)}] "${f.title}"`);
  }

  if (!APPLY) {
    console.log(`\n💡 Ejecuta con --apply para aplicar los cambios:\n`);
    console.log(`   node scripts/reclassify-articles.mjs --apply\n`);
    return;
  }

  // Agrupar por categoría destino para hacer batch updates
  const byCategory = {};
  for (const f of toFix) {
    if (!byCategory[f.to]) byCategory[f.to] = [];
    byCategory[f.to].push(f.id);
  }

  let updated = 0;
  let failed  = 0;

  for (const [cat, ids] of Object.entries(byCategory)) {
    const { error } = await supabase
      .from('articles')
      .update({ category: cat, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      console.error(`❌ Error actualizando categoría "${cat}":`, error.message);
      failed += ids.length;
    } else {
      console.log(`✅ ${ids.length} artículo(s) movido(s) a "${cat}"`);
      updated += ids.length;
    }
  }

  console.log('\n─'.repeat(60));
  console.log(`\n🎯 Resultado: ${updated} corregidos, ${failed} fallidos.\n`);
}

main().catch(err => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});
