/**
 * fix_categories.js — Auditoría y corrección de secciones
 * Uso:  node scratch/fix_categories.js            → corrige la BD
 *       node scratch/fix_categories.js --dry-run  → solo muestra, no guarda
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');

// ─── AUTORES OFICIALES ────────────────────────────────────────────────────────
const SECTION_AUTHORS = {
  noticias:       'Redacción Central',
  politica:       'Mesa Política',
  economia:       'Redacción Económica',
  internacional:  'Redacción Internacional',
  deportes:       'Mesa Deportiva',
  sucesos:        'Redacción de Sucesos',
  salud:          'Sección de Salud y Bienestar',
  entretenimiento:'Sección Espectáculos',
  cultura:        'Sección Cultural',
  tecnologia:     'Redacción Tecnológica',
  tendencias:     'Mesa de Tendencias',
  opinion:        'Dirección Editorial',
};

// ─── MATCHING CON PALABRA COMPLETA ────────────────────────────────────────────
// Evita que "liga" matchee "obliga" o "ia" matchee "policía"
function wordMatch(text, keyword) {
  if (keyword.includes(' ')) {
    // Frases multi-palabra: substring normal (ya son suficientemente específicas)
    return text.includes(keyword);
  }
  // Palabra individual: debe estar rodeada de no-letras españolas
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?<![a-záéíóúüñ])${escaped}(?![a-záéíóúüñ])`, 'i');
  return re.test(text);
}

// Normaliza tildes y pasa a minúsculas para la comparación
function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ─── REGLAS DE CLASIFICACIÓN (orden de prioridad) ─────────────────────────────
// Regla más específica primero. Si coincide → esa categoría, para.
const RULES = [
  // ── SUCESOS: crímenes, accidentes, policía ──
  {
    category: 'sucesos',
    keywords: [
      // Violencia
      'asesinado','asesinaron','asesinato','homicidio','homicidios',
      'matan a','mataron a','cadáver','cuerpo sin vida',
      'disparo mortal','tiros al','rafaga de balas',
      // Accidentes
      'accidente de transito','choque fatal','colision fatal','volcamiento',
      'muertos en accidente','heridos en accidente',
      // Policial
      'detenido por','detenidos por','arrestado por','capturado por',
      'operativo policial','allanamiento','fiscalia investiga',
      'ministerio publico investiga','condenado a','sentenciado a',
      // Emergencias
      'incendio destruye','incendio consume','fuga de gas',
      'derrumbe','victimas fatales',
      // Robos/secuestros
      'robo a mano armada','asaltaron','secuestrado','rehenes',
    ],
  },

  // ── DEPORTES ──
  {
    category: 'deportes',
    keywords: [
      // Béisbol
      'beisbol','jonron','lanzador abridor','pitcher','home run',
      'serie del caribe','serie nacional dominicana',
      'aguilas cibaenas','tigres del licey','estrellas orientales',
      'leones del escogido','toros del este','gigantas',
      'mlb','grandes ligas','dodgers','yankees','mets','phillies',
      // Fútbol
      'gol de','anota gol','partido de futbol','liga de futbol',
      'premier league','champions league','la liga','serie a','bundesliga',
      'copa del mundo','eliminatorias','seleccion nacional de futbol',
      'lionel messi','cristiano ronaldo','mbappe',
      // Baloncesto
      'nba','baloncesto profesional','basquetbol',
      // Otros deportes
      'atletismo','olimpicos','paris 2024','los angeles 2028',
      'boxeo','pelea de boxeo','titulo mundial de boxeo',
      'tenis abierto','wimbledon','roland garros','us open',
      'ciclismo','vuelta a españa','tour de france',
      // Genéricos deportivos
      'campeonato de','torneo de','clasifico al mundial',
      'medalla de oro','medalla de plata','medalla de bronce',
    ],
  },

  // ── ECONOMÍA ──
  {
    category: 'economia',
    keywords: [
      'pib dominicano','producto interno bruto',
      'inflacion sube','inflacion baja','tasa de inflacion',
      'banco central dominicano','reservas internacionales',
      'tipo de cambio','dolar sube','dolar baja','peso dominicano',
      'inversion extranjera directa','exportaciones dominicanas',
      'deuda publica','presupuesto nacional',
      'dgii','itbis','reforma fiscal','aranceles de importacion',
      'tasa de desempleo','desempleo sube','mercado laboral',
      'salario minimo dominicano','aumento salarial',
      'crecimiento economico','recesion economica',
      'zona franca','turismo aporta','remesas familiares',
      'precio del barril','precio del combustible',
      'banreservas','banco popular','bhd','banco multiple',
      'bolsa de valores','mercado de capitales','bonos soberanos',
      'fmi recomienda','banco mundial aprueba','prestamo de',
      'subsidio al combustible','precio de los alimentos sube',
    ],
  },

  // ── POLÍTICA ──
  {
    category: 'politica',
    keywords: [
      // Personas
      'presidente abinader','luis abinader','vicepresidente','raquel pena',
      'senador','senadora','diputado','diputada',
      'ministro de','ministra de','secretario de estado',
      // Instituciones
      'congreso nacional','camara de diputados','senado de la republica',
      'jce','junta central electoral',
      'poder ejecutivo','poder judicial','poder legislativo',
      'tribunal constitucional','suprema corte',
      // Partidos
      'partido prm','partido pld','fuerza del pueblo','alianza pais',
      // Actos políticos
      'elecciones 2024','elecciones 2026','elecciones municipales',
      'candidato presidencial','candidata presidencial',
      'decreto presidencial','proyecto de ley aprobado',
      'reforma constitucional','asamblea nacional',
      'ayuntamiento de','alcalde de','alcaldesa de',
      // Gobierno
      'gobierno dominicano anuncia','el gobierno de rd',
      'plan de gobierno','politica publica',
    ],
  },

  // ── SALUD ──
  {
    category: 'salud',
    keywords: [
      'ministerio de salud','salud publica dominicana','sns dominicano',
      'hospital','clinica de','centro medico',
      'vacunacion','campana de vacunacion','dosis de vacuna',
      'dengue en rd','malaria en rd','brote de','epidemia de',
      'pandemia','covid-19','coronavirus',
      'cancer de','tumor maligno','oncologia',
      'diabetes tipo','hipertension arterial','obesidad infantil',
      'medicamento aprobado','farmaco nuevo','ensayo clinico',
      'embarazo de riesgo','mortalidad materna','mortalidad infantil',
      'nutricion infantil','seguridad alimentaria',
    ],
  },

  // ── TECNOLOGÍA (palabras muy específicas para evitar falsos positivos) ──
  {
    category: 'tecnologia',
    keywords: [
      // IA / Software
      'inteligencia artificial','chatgpt','openai','deepmind',
      'google gemini','gpt-4','gpt-5','claude ai','anthropic',
      'machine learning','aprendizaje automatico',
      // Hardware / Dispositivos
      'iphone nuevo','apple lanza','samsung galaxy','pixel de google',
      'chip de silicio','semiconductores','intel lanza','amd lanza',
      // Empresas tech
      'microsoft anuncia','amazon web services','aws','meta platforms',
      'mark zuckerberg','elon musk compra','spacex lanza',
      'tesla anuncia','nvidia ganancias',
      // Ciberseguridad
      'ciberataque','ciberseguridad','ransomware','hackeo masivo',
      'brecha de datos','datos filtrados','phishing masivo',
      // Crypto / Web3
      'bitcoin sube','bitcoin baja','ethereum','criptomoneda',
      'blockchain dominicano',
      // Telecomunicaciones
      'red 5g','fibra optica dominicana','banda ancha',
      // Apps / Plataformas
      'nueva aplicacion','app lanzada','actualizacion de ios',
      'actualizacion de android',
    ],
  },

  // ── ENTRETENIMIENTO ──
  {
    category: 'entretenimiento',
    keywords: [
      // Farándula dominicana
      'farandula dominicana','espectaculos dominicanos',
      'planeta alofoke','el pachá','alofoke radio',
      // Artistas internacionales
      'bad bunny anuncia','romeo santos lanza','shakira',
      'maluma','karol g','j balvin','daddy yankee',
      'juan luis guerra','sergio vargas','antony santos',
      // Entretenimiento genérico
      'concierto en rd','concierto en santo domingo',
      'gira de','pelicula estrena','serie de netflix estrena',
      'grammy latino','premios billboard','premios oscar',
      'novela de tv','telenovela','reality show',
      'actor dominicano','actriz dominicana','cantante dominicano',
    ],
  },

  // ── CULTURA ──
  {
    category: 'cultura',
    keywords: [
      'museo de arte','galeria de arte','patrimonio cultural dominicano',
      'festival cultural','feria del libro dominicano',
      'carnaval dominicano','carnaval de la vega',
      'obra de teatro','temporada de teatro',
      'ministerio de cultura dominicano',
      'artesania dominicana','folklore dominicano',
      'literatura dominicana','poeta dominicano',
      'exposicion de arte en rd','bellas artes',
    ],
  },

  // ── TENDENCIAS (viral, redes sociales) ──
  {
    category: 'tendencias',
    keywords: [
      'se viralizo en tiktok','viral en instagram','video viral',
      'reto viral','challenge viral','meme viral',
      'tendencia en redes','trending topic',
      'tiktoker dominicano','influencer dominicano',
    ],
  },

  // ── INTERNACIONAL ──
  {
    category: 'internacional',
    keywords: [
      // EEUU
      'donald trump','joe biden','kamala harris','senado americano',
      'casa blanca anuncia','congreso de estados unidos',
      // Europa
      'union europea anuncia','comision europea','parlamento europeo',
      'otan declara','nato acuerda',
      // Conflictos
      'guerra en ucrania','conflicto israel','bombardeos en',
      'tropas rusas','ejercito israelí',
      // Asia / Otros
      'xi jinping','china anuncia','corea del norte',
      'iran amenaza','iran lanza',
      // Organismos internacionales
      'onu aprueba','naciones unidas declara','oms advierte',
      'fmi proyecta','banco mundial publica','g20 acuerda',
      // América Latina
      'gobierno venezolano','maduro','gobierno cubano','nicaragua ortega',
      'gobierno de haiti','primer ministro de haiti',
      'milei argentina','lula brasil','petro colombia',
      'migrantes haitianos','crisis migratoria en',
    ],
  },

  // ── OPINIÓN ──
  {
    category: 'opinion',
    keywords: [
      'opinion:','editorial:','columna de','analisis de',
      'carta abierta a','reflexion sobre','ensayo sobre',
      'a mi juicio','en mi opinion','perspectiva editorial',
      'punto de vista de','por el autor','por el columnista',
    ],
  },
];

// ─── CLASIFICAR UN ARTÍCULO ───────────────────────────────────────────────────
function classifyArticle(article) {
  const raw = `${article.title || ''} ${article.excerpt || ''}`;
  const text = normalize(raw);

  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (wordMatch(text, normalize(kw))) {
        return { category: rule.category, matchedKeyword: kw };
      }
    }
  }
  return null;
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function auditAndFix() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  AUDITORÍA DE SECCIONES — Imperio Público');
  console.log(`  Modo: ${DRY_RUN ? '🔍 DRY-RUN (solo lectura)' : '✏️  CORRECCIÓN REAL'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, excerpt, category, author')
    .order('publishedAt', { ascending: false });

  if (error) {
    console.error('Error al obtener artículos:', error.message);
    process.exit(1);
  }

  console.log(`Total de artículos en BD: ${articles.length}\n`);

  // Distribución actual
  const currentCounts = {};
  articles.forEach(a => { currentCounts[a.category] = (currentCounts[a.category] || 0) + 1; });
  console.log('📊 Distribución ACTUAL por sección:');
  Object.entries(currentCounts).sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`   ${cat.padEnd(18)} ${String(count).padStart(3)} artículos`));

  console.log('\n🔍 Analizando clasificación...\n');

  const toFix = [];
  let correct = 0;
  let uncertain = 0;

  for (const article of articles) {
    const result = classifyArticle(article);

    if (!result) {
      uncertain++;
      continue;
    }

    if (result.category !== article.category) {
      toFix.push({
        id: article.id,
        title: article.title,
        currentCategory: article.category,
        correctCategory: result.category,
        correctAuthor: SECTION_AUTHORS[result.category],
        matchedKeyword: result.matchedKeyword,
      });
    } else {
      correct++;
    }
  }

  console.log(`✅ Correctamente clasificados : ${correct}`);
  console.log(`⚠️  Sin clasificación segura  : ${uncertain} (no se tocarán)`);
  console.log(`❌ Mal clasificados detectados: ${toFix.length}\n`);

  if (toFix.length === 0) {
    console.log('🎉 ¡Todo está en orden! No hay artículos mal clasificados.\n');
    return;
  }

  console.log('══ ARTÍCULOS A CORREGIR ══════════════════════════════════');
  toFix.forEach((item, i) => {
    console.log(`\n${i + 1}. "${item.title.slice(0, 85)}"`);
    console.log(`   Sección actual   → ${item.currentCategory.toUpperCase()}`);
    console.log(`   Sección correcta → ${item.correctCategory.toUpperCase()}  (keyword: "${item.matchedKeyword}")`);
  });

  if (DRY_RUN) {
    console.log('\n\n⚠️  DRY-RUN: no se guardaron cambios.');
    console.log('   Ejecuta SIN --dry-run para aplicar.\n');
    return;
  }

  // ── Aplicar correcciones ──
  console.log('\n\n⚙️  Aplicando correcciones...\n');
  let fixed = 0, failed = 0;

  for (const item of toFix) {
    const { error: updateError } = await supabase
      .from('articles')
      .update({ category: item.correctCategory, author: item.correctAuthor })
      .eq('id', item.id);

    if (updateError) {
      console.error(`   ✗ [${item.id}] ${updateError.message}`);
      failed++;
    } else {
      console.log(`   ✓ "${item.title.slice(0, 65)}" → ${item.correctCategory.toUpperCase()}`);
      fixed++;
    }
  }

  // Distribución final
  const { data: final } = await supabase.from('articles').select('category');
  const finalCounts = {};
  final.forEach(a => { finalCounts[a.category] = (finalCounts[a.category] || 0) + 1; });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  ✓ Corregidos: ${fixed}   ✗ Fallidos: ${failed}`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('\n📊 Distribución FINAL por sección:');
  Object.entries(finalCounts).sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`   ${cat.padEnd(18)} ${String(count).padStart(3)} artículos`));
  console.log('');
}

auditAndFix().catch(err => { console.error('Error crítico:', err); process.exit(1); });
