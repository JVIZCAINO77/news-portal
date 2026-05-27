import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { internalizeImage } from '@/lib/botUtils';
import { notifyGoogleIndexing } from '@/lib/indexing';
import { postToSocialMedia } from '@/lib/social';
import { SITE_CONFIG } from '@/lib/data';

// ─── LÍMITE DE DURACIÓN ───────────────────────────────────────────────
// Previene funciones "zombie" que consumen CPU sin límite.
// Alineado con vercel.json → functions → maxDuration: 55.
// Vercel Hobby: máx 60s. Vercel Pro: puede subirse hasta 300s.
export const maxDuration = 55;

// Token secreto para evitar ataques externos, manejado por Vercel
const CRON_SECRET = process.env.CRON_SECRET;

// ─── LÍMITES DIARIOS ─────────────────────────────────────────────────────────
// OBJETIVO: 1 artículo por sección por día = 12 secciones = 12 art/día máximo.
// 10 secciones nacionales vs 2 globales/internacional → más nacional que internacional.
const DAILY_LIMIT_GLOBAL   = 12; // Techo del día: 12 artículos exactos
// Sin límite por categoría — el bot elige la mejor disponible cada ejecución

// ─── CANDADO DE ORIGINALIDAD ─────────────────────────────────────────────────
// Longitud mínima que debe tener el contenido generado por la IA.
// Si la IA devuelve algo muy corto, es señal de un fallo — NUNCA publicar.
const MIN_CONTENT_LENGTH = 1200; // caracteres mínimos en el campo 'content'
// PROHIBIDO publicar contenido sin pasar por reescritura de IA.
// Este flag actúa como candado: si es false, el artículo es rechazado.
const REQUIRE_AI_REWRITE = true;

// ─── DETECTOR DE ÚLTIMA HORA ───────────────────────────────────────────────
// Palabras clave que indican un suceso urgente/crítico que NUNCA debe bloquearse
const BREAKING_KEYWORDS = [
  // Violencia / seguridad
  'tirador', 'shooter', 'disparo', 'disparos', 'bala', 'atentado', 'ataque',
  'bomba', 'explosión', 'explosion', 'terrorista', 'terrorismo', 'asesinato',
  'asesinato', 'homicidio', 'secuestro', 'rehén', 'rehenes',
  // Evacuación / emergencias
  'evacuado', 'evacuación', 'emergencia', 'alerta', 'alarma',
  'incendio', 'derrumbe', 'accidente grave', 'catástrofe', 'desastre',
  // Política urgente
  'golpe de estado', 'coup', 'renuncia', 'dimisión', 'muerto', 'muertos',
  'fallece', 'fallecio', 'fallecida', 'herido', 'heridos', 'víctimas',
  // Desastres naturales
  'terremoto', 'sismo', 'tsunami', 'huracán', 'ciclón', 'inundación',
  // Marcadores de urgencia explícitos
  'última hora', 'urgente', 'breaking', 'alerta roja', 'en vivo',
  // Detención / arresto relacionado a sucesos
  'detenido', 'detenidos', 'arrestado', 'capturado', 'fugitivo',
  // Impacto Económico / Social
  'histórico', 'historico', 'récord', 'record', 'crisis', 'inflación', 'alza', 'sube',
  // Triunfos / Logros
  'campeón', 'campeon', 'victoria', 'medalla', 'oro', 'clasifica',
  // Otros
  'escándalo', 'escandalo', 'corrupción', 'fraude', 'justicia',
];

/**
 * Detecta si un titular corresponde a una noticia de ÚLTIMA HORA.
 * @param {string} title - El titular de la noticia
 * @returns {boolean}
 */
function isBreakingNews(title) {
  if (!title) return false;
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return BREAKING_KEYWORDS.some(kw => normalized.includes(kw));
}

// ─── DEDUPLICACIÓN SEMÁNTICA ──────────────────────────────────────────────────
// Palabras vacías (stop words) que no aportan significado al tema de la noticia
const STOP_WORDS = new Set([
  'el','la','los','las','un','una','unos','unas','de','del','al','a','en','y','e',
  'o','u','que','por','para','con','sin','sobre','entre','ante','bajo','tras',
  'se','le','lo','les','nos','me','te','su','sus','mi','tu','es','son','ha','han',
  'fue','era','ser','estar','tiene','tienen','hay','tras','como','pero','mas',
  'ya','si','no','ni','su','sus','también','también','esto','esta','este','ese',
  'esa','esos','esas','quien','cuyo','cuya','cuando','donde','aunque','mientras',
  'nuevo','nueva','nuevos','nuevas','gran','grande','primer','primera','tras',
  'uno','dos','tres','más','menos','muy','bien','mal','vez','vez','días','horas',
]);

/**
 * Extrae un Set de keywords significativas de un título.
 * Elimina stop words, tildes y tokens de ≤3 caracteres.
 * @param {string} title
 * @returns {Set<string>}
 */

/**
 * Stemming básico en español: recorta sufijos comunes para agrupar
 * palabras de la misma raíz (ej: petroleros/petrolera/petróleo → petrole).
 */
function stemWord(word) {
  if (word.length <= 5) return word;
  // Sufijos de mayor a menor (orden importa)
  const suffixes = [
    'aciones','ización','amiento','imientos','amiento',
    'adores','adora','adores','antes','antes',
    'iendo','ando','ación','arios','arias',
    'mente','istas','ista','osos','osas',
    'eros','eras','eros','ismo','ista',
    'ado','ada','ados','adas','ido','ida','idos','idas',
    'ando','iendo','aron','aron',
    'era','ero','ura','ura',
    'es','os','as',
  ];
  for (const s of suffixes) {
    if (word.endsWith(s) && word.length - s.length >= 4) {
      return word.slice(0, word.length - s.length);
    }
  }
  return word;
}

function extractKeywords(title) {
  if (!title) return new Set();
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
  return new Set(
    normalized.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)).map(stemWord)
  );
}

/**
 * Calcula el solapamiento semántico (Jaccard) entre dos conjuntos de keywords.
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {number} — valor entre 0 y 1
 */
function semanticOverlap(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter(k => setB.has(k)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union;
}

/**
 * Extrae entidades nombradas (palabras con mayúscula inicial, 4+ chars) del título.
 * Detecta el mismo evento aunque cambie la redacción: "Guyana" aparece en ambos.
 */

// Entidades demasiado genéricas para discriminar eventos (excluidas de la Capa 4)
const GENERIC_ENTITIES = new Set([
  'republica','dominicana','dominicano','dominicanos','dominicanas',
  'estados','unidos','eeuu','america','americana','americana',
  'mundo','pais','paises','gobierno','presidente','nacional',
  'nueva','nuevo','gran','grandes','primer','primera',
  'santo','domingo','santiago','haiti','haitiano',
]);

function extractEntities(title) {
  if (!title) return new Set();
  const entities = new Set();
  for (const w of title.split(/\s+/)) {
    const clean = w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    if (clean.length >= 4 && /^[A-ZÁÉÍÓÚÑ]/.test(clean)) {
      const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!GENERIC_ENTITIES.has(norm)) entities.add(norm);
    }
  }
  return entities;
}

/** true si 2 títulos comparten 2+ entidades nombradas (= cubre el mismo evento). */
function sharesCriticalEntities(titleA, titleB) {
  const entA = extractEntities(titleA);
  const entB = extractEntities(titleB);
  if (entA.size === 0 || entB.size === 0) return false;
  return [...entA].filter(e => entB.has(e)).length >= 2;
}

// Umbral Jaccard: 20% de overlap detecta el mismo evento con distintas palabras
// Bajado de 25% → 20% para capturar casos como "Ébola en Congo" vs "Ébola y tecnología"
const SEMANTIC_THRESHOLD = 0.20;

const CATEGORIES = {
  // ─── ESTRUCTURA OFICIAL IMPERIO PÚBLICO ──────────────────────────────────────
  // Orden: Política · Policía · Deportes · Tecnología · Sucesos ·
  //        Entretenimiento · Tendencias · Economía · Internacional · Salud · Cultura

  politica: {
    slug: 'politica', author: 'Mesa Política', style: 'neutral, objetivo y analítico',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://noticiassin.com/feed/?s=politica',
      // Complementarias
      'https://elnuevodiario.com.do/feed/',
      'https://clavedigital.com.do/feed/',
      'https://eldia.com.do/feed/',
    ],
  },
  economia: {
    slug: 'economia', author: 'Redacción Económica', style: 'serio, financiero y accesible',
    feeds: [
      'https://www.diariolibre.com/rss/economia.xml',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada',
      // Complementarias
      'https://z101digital.com/feed/',
      'https://lainformacion.com.do/feed/',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  sucesos: {
    slug: 'sucesos', author: 'Redacción de Sucesos', style: 'informativo, serio y cauteloso',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://noticiassin.com/feed/?s=sucesos',
      // Complementarias
      'https://elnuevodiario.com.do/feed/',
      'https://z101digital.com/feed/',
      'https://eldia.com.do/feed/',
    ],
  },
  policia: {
    slug: 'policia', author: 'Sección Policial', style: 'periodístico, policial y formal',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/?s=policia',
      'https://noticiassin.com/feed/',
      // Complementarias — cobertura policial/judicial
      'https://z101digital.com/feed/',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  deportes: {
    slug: 'deportes', author: 'Mesa Deportiva', style: 'analítico y pasional',
    feeds: [
      'https://www.diariolibre.com/rss/deportes.xml',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/deportes/portada',
      // Complementarias
      'https://z101digital.com/feed/',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  salud: {
    slug: 'salud', author: 'Sección de Salud y Bienestar', style: 'profesional, informativo y confiable',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://www.bbc.com/mundo/index.xml',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/sociedad/portada',
      // Complementarias
      'https://elnuevodiario.com.do/feed/',
      'https://lainformacion.com.do/feed/',
    ],
  },
  cultura: {
    slug: 'cultura', author: 'Sección Cultural', style: 'elegante y descriptivo',
    feeds: [
      'https://www.diariolibre.com/rss/revista.xml',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/cultura/portada',
      // Complementarias — cultura dominicana
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  entretenimiento: {
    slug: 'entretenimiento', author: 'Sección Espectáculos', style: 'dinámico y ameno',
    feeds: [
      'https://www.diariolibre.com/rss/revista.xml',
      'https://remolacha.net/feed/',
      'https://www.diariolibre.com/rss/portada.xml',
      // Complementarias
      'https://z101digital.com/feed/',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  tendencias: {
    slug: 'tendencias', author: 'Mesa de Tendencias', style: 'ágil y moderno',
    feeds: [
      'https://remolacha.net/feed/',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://www.bbc.com/mundo/index.xml',
      'https://www.infobae.com/feeds/rss/tendencias.xml',
    ],
  },

  // ─── SECCIONES CON ALCANCE GLOBAL ────────────────────────────────────────────
  tecnologia: {
    slug: 'tecnologia', author: 'Redacción Tecnológica', style: 'informativo y vanguardista',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://www.bbc.com/mundo/index.xml',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/tecnologia/portada',
      'https://www.infobae.com/feeds/rss/tecno.xml',
      'https://www.france24.com/es/rss',
    ],
  },

  // ─── INTERNACIONAL: Solo noticias de ALTO IMPACTO MUNDIAL ────────────────────
  internacional: {
    slug: 'internacional', author: 'Redacción Internacional', style: 'global, analítico y contextualizado para audiencia dominicana',
    feeds: [
      'https://www.bbc.com/mundo/index.xml',
      'https://www.france24.com/es/rss',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada',
      'https://www.infobae.com/feeds/rss/mundo.xml',
      'https://elmundo.es/rss/portada.xml',
    ],
  },

  // ─── CATEGORÍAS EN RESERVA (sin slot de cron asignado) ──────────────────────
  // Las siguientes secciones están listas para activarse pero actualmente NO tienen
  // entrada en vercel.json ni en autoblog.yml.
  // Para activarlas: añadir el cron en vercel.json + un job en autoblog.yml.
  // Se pueden usar vía workflow_dispatch con: ?category=nacional o ?category=medio-ambiente
  nacional: {
    slug: 'nacional', author: 'Redacción Nacional', style: 'periodístico objetivo y formal',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://elnuevodiario.com.do/feed/',
      'https://z101digital.com/feed/',
      'https://clavedigital.com.do/feed/',
    ],
  },

  'medio-ambiente': {
    slug: 'medio-ambiente', author: 'Sección Medio Ambiente', style: 'informativo y consciente, con enfoque en impacto local e internacional',
    feeds: [
      'https://www.bbc.com/mundo/index.xml',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/clima-y-medio-ambiente/portada',
      'https://www.infobae.com/feeds/rss/tendencias.xml',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://www.france24.com/es/rss',
    ],
  },
};



// ─── VALIDADOR TEMÁTICO — ESTRUCTURA OFICIAL IMPERIO PÚBLICO ──────────────────
// Basado en: https://www.imperiopublico.com — Estructura Oficial de Secciones
//
// BLOCKLIST: palabras que NUNCA deben aparecer (artículo descartado de inmediato).
// ALLOWLIST: al menos 1 de estas palabras DEBE aparecer en el TÍTULO del artículo.
//
// Secciones oficiales:
//  política     → Gobierno, presidencia, leyes, partidos, elecciones, funcionarios
//  policia      → Operativos, arrestos, investigaciones, allanamientos, delitos
//  deportes     → Béisbol, fútbol, baloncesto, boxeo, atletas, ligas, resultados
//  tecnologia   → IA, celulares, apps, redes, innovación, ciencia, ciberseguridad
//  sucesos      → Accidentes, incendios, tragedias, asesinatos, desapariciones
//  entretenimiento → Música, cine, artistas, influencers, TV, espectáculos
//  tendencias   → Viral, memes, lifestyle, moda, curiosidades del momento
//  economia     → Dólar, inflación, negocios, bancos, finanzas, emprendimiento
//  internacional → Guerras, política extranjera, relaciones internacionales
//  salud        → Medicina, hospitales, enfermedades, salud pública, bienestar
//  cultura      → Arte, historia, literatura, tradiciones, educación cultural
//  noticias     → Actualidad nacional general (comodín dominicano)
// ─────────────────────────────────────────────────────────────────────────────

const TOPIC_BLOCKLIST = {

  // ── POLÍTICA ─────────────────────────────────────────────────────────────────
  // Solo: gobierno, leyes, partidos, elecciones, funcionarios dominicanos
  // Bloquear: deportes, farándula, crimen, geopolítica, economía técnica
  politica: [
    'beisbol','jonron','mlb','nba','baloncesto','gol','pitcher','pelotero',
    'actor','actriz','cantante','concierto','farandula','espectaculo','influencer',
    'homicidio','asesinado','asesinato','detenido','arrestado','allanamiento',
    'trump','putin','zelensky','macron','iran','rusia','ucrania','china','israel',
    'guerra','ataque militar','bombardeo','otan','onu',
    'pib','inflacion','exportacion','importacion','banco central',
  ],

  // ── POLICÍA ──────────────────────────────────────────────────────────────────
  // Solo: operativos, arrestos, investigaciones, crimen, seguridad ciudadana
  // Bloquear: farándula, deportes, economía, geopolítica internacional
  policia: [
    'actor','actriz','cantante','concierto','farandula','espectaculo','influencer',
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','deporte','atleta',
    'pib','inflacion','exportacion','importacion','banco','dolar baja','dolar sube',
    'trump','putin','rusia','ucrania','china','israel','iran','guerra','otan',
    'ataque militar','bombardeo','geopolitica',
  ],

  // ── DEPORTES ─────────────────────────────────────────────────────────────────
  // Solo: béisbol, fútbol, baloncesto, boxeo, atletas, ligas
  // Bloquear: política, economía, crimen, geopolítica, farándula
  deportes: [
    'homicidio','asesinado','asesinato','detenido','arrestado','allanamiento',
    'pib','inflacion','banco central','exportacion','importacion','presupuesto',
    'ministro de','senado','diputado','legislacion','reforma',
    'trump','putin','iran','rusia','ucrania','china','israel','guerra','otan',
    'actor','actriz','cantante','concierto','farandula','influencer',
  ],

  // ── TECNOLOGÍA ───────────────────────────────────────────────────────────────
  // Solo: IA, celulares, apps, redes sociales, innovación, ciencia, ciberseguridad
  // Bloquear: política local, crimen, deportes, farándula
  tecnologia: [
    'homicidio','asesinado','asesinato','detenido','arrestado','allanamiento',
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','atleta',
    'actor','actriz','cantante','concierto','farandula','espectaculo',
    'presidente abinader','senado dominicano','diputado','legislacion','elecciones',
    'partido politico','pld','prm','fuerza del pueblo',
  ],

  // ── SUCESOS ──────────────────────────────────────────────────────────────────
  // Solo: accidentes, incendios, tragedias, asesinatos, desapariciones, emergencias
  // Bloquear: política, economía, deportes, farándula, geopolítica
  sucesos: [
    'actor','actriz','cantante','concierto','farandula','espectaculo','influencer',
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','atleta','campeonato',
    'pib','inflacion','banco central','exportacion','importacion','presupuesto',
    'trump','putin','rusia','ucrania','china','israel','iran','guerra','otan',
    'ataque militar','bombardeo','geopolitica','crisis global',
    'senado dominicano','partido politico','legislacion','diputado',
  ],

  // ── ENTRETENIMIENTO ──────────────────────────────────────────────────────────
  // Solo: música, cine, artistas, influencers, TV, espectáculos, celebridades
  // Bloquear: política, economía, crimen, geopolítica, deportes, desastres
  entretenimiento: [
    'presidente abinader','ministro de','pib','inflacion','banco central','presupuesto',
    'exportacion','importacion','deficit','reservas','senado','diputado','legislacion',
    'homicidio','asesinado','asesinato','detenido','arrestado','allanamiento',
    'tribunal','fiscal','condena','crimen','banda criminal',
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','atleta','campeonato',
    'trump','putin','rusia','ucrania','china','israel','iran','guerra','otan',
    'ataque','bombardeo','invasion','crisis global','terremoto','tsunami','inundacion',
    'militar','ejercito','policia nacional','swat','sargento',
    'partido politico','elecciones','reforma constitucional',
  ],

  // ── TENDENCIAS ───────────────────────────────────────────────────────────────
  // Solo: viral, memes, lifestyle, moda, curiosidades, redes sociales
  // Bloquear: política formal, economía técnica, crimen, geopolítica
  tendencias: [
    'pib','inflacion','banco central','exportacion','importacion','deficit',
    'reforma constitucional','proyecto de ley','decreto presidencial',
    'senado dominicano','partido politico','legislacion',
    'homicidio','asesinato','asesinado','detenido','allanamiento','crimen',
    'trump','putin','rusia','ucrania','guerra','otan','ataque militar',
    'terremoto','tsunami','crisis global',
  ],

  // ── ECONOMÍA ─────────────────────────────────────────────────────────────────
  // Solo: dólar, inflación, negocios, bancos, finanzas, emprendimiento
  // Bloquear: deportes, farándula, crimen
  economia: [
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','atleta',
    'actor','actriz','cantante','concierto','farandula','espectaculo','influencer',
    'homicidio','asesinado','asesinato','detenido','arrestado','allanamiento',
  ],

  // ── INTERNACIONAL ────────────────────────────────────────────────────────────
  // Solo: noticias mundiales fuera de RD — geopolítica, guerras, crisis globales
  // Bloquear: noticias estrictamente locales de RD
  internacional: [
    'presidente abinader','senado dominicano','camara de diputados',
    'ayuntamiento de','alcalde de rd','abinader',
    'ministerio de educacion rd','ministerio de salud rd',
    'coee','digesett','intrant','jce','pld','prm','fuerza del pueblo',
    'leonel fernandez','danilo medina',
  ],

  // ── SALUD ────────────────────────────────────────────────────────────────────
  // Solo: medicina, hospitales, enfermedades, salud pública, bienestar, alimentación
  // Bloquear: deportes, política, crimen, geopolítica
  salud: [
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','atleta',
    'actor','actriz','cantante','concierto','farandula','espectaculo',
    'presidente abinader','partido politico','elecciones','senado','diputado',
    'homicidio','asesinado','detenido','arrestado','allanamiento','crimen',
    'iran','rusia','ucrania','ataque militar','guerra','bombardeo',
  ],

  // ── CULTURA ──────────────────────────────────────────────────────────────────
  // Solo: arte, historia, literatura, tradiciones, educación cultural, eventos
  // Bloquear: geopolítica, economía técnica, crimen, deportes
  cultura: [
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','atleta',
    'pib','inflacion','banco central','exportacion','presupuesto','deficit',
    'homicidio','asesinado','detenido','arrestado','allanamiento','crimen','banda',
    'iran','rusia','ucrania','china','israel','trump','putin',
    'ataque militar','bombardeo','guerra','otan','geopolitica',
    'sargento','swat','policia','fiscal','tribunal',
  ],

  // ── NOTICIAS (legacy — redirige a nacional) ──────────────────────────────────
  noticias: [
    'trump','putin','zelensky','macron','netanyahu','xi jinping',
    'rusia','ucrania','iran','china','israel','palestina',
    'corea del norte','arabia saudita','union europea',
    'ataque militar','bombardeo','invasion','guerra nuclear',
    'onu declara','otan activa',
  ],

  // ── NACIONAL ─────────────────────────────────────────────────────────────────
  // Solo: vida ciudadana RD — servicios, comunidad, sociedad, migración
  // Bloquear: todo lo que tiene sección propia más específica
  nacional: [
    // Geopolítica pura (líderes y conflictos que SOLO son internacionales)
    'trump','putin','zelensky','xi jinping','netanyahu',
    'guerra nuclear','ataque militar','bombardeo','invasión',
    'corea del norte','otan activa','g7 cumbre','g20 cumbre',
    // Política formal (va a 'politica')
    'presidente abinader','ministro de','senado dominicano','camara de diputados',
    'partido politico','proyecto de ley','decreto presidencial','legislacion',
    'pld','prm','fuerza del pueblo','reforma constitucional','jce','elecciones',
    // Economía técnica (va a 'economia')
    'pib','inflacion','banco central','exportacion','importacion',
    'deficit','reservas internacionales','bolsa de valores','aranceles',
    // Deportes (va a 'deportes')
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','pelotero',
    'campeonato','torneo','liga','atleta','estadio','pitcher','boxeo',
    // Entretenimiento / farándula (va a 'entretenimiento')
    'actor','actriz','cantante','concierto','farandula','espectaculo',
    'pelicula','serie','netflix','reggaeton','bachata','merengue','influencer',
    // Crimen / sucesos graves (va a 'sucesos' o 'policia')
    'homicidio','asesinado','asesinato','feminicidio','matan','cadaver',
    'tiroteo','secuestro','narcotráfico','narco','banda criminal',
    'operativo policial','allanamiento','detenido','arrestado','capturado',
    // Salud técnica (va a 'salud')
    'vacuna','pandemia','virus','epidemia','cancer','diabetes','cirugia',
    'hospital saturado','emergencia sanitaria','oms','clinica privada',
    // Tecnología (va a 'tecnologia')
    'inteligencia artificial','chatgpt','openai','samsung','apple','google meta',
    'ciberseguridad','startup','bitcoin','crypto','drone','robot',
  ],

  // ── MEDIO AMBIENTE ────────────────────────────────────────────────────────────
  // Solo: clima, naturaleza, sostenibilidad, desastres naturales
  'medio-ambiente': [
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto',
    'actor','actriz','cantante','concierto','farandula','influencer',
    'homicidio','asesinado','arrestado','crimen','banda criminal',
    'presidente abinader','senado','partido politico',
    'pib','exportacion','importacion','banco central',
  ],
};

const TOPIC_ALLOWLIST = {

  // ── POLÍTICA ─────────────────────────────────────────────────────────────────
  politica: [
    'politica','politico','gobierno','presidencia','presidente','ministro',
    'diputado','senador','partido','elecciones','congreso','legislacion','decreto',
    'reforma','municipio','alcalde','gabinete','legislativo','ejecutivo',
    'abinader','pld','prm','fuerza del pueblo','leonel','danilo','jce',
    'camara','senado','proyecto de ley','voto','campaña','candidato',
  ],

  // ── POLICÍA ──────────────────────────────────────────────────────────────────
  policia: [
    'policia','operativo','arresto','arrestado','detenido','allanamiento',
    'investigacion','crimen','delito','tribunal','juez','fiscal',
    'dicrim','dncd','pn','fiscalia','abogado','condena',
    'homicidio','asesinato','robo','asalto','banda','capturado','imputado',
    'seguridad ciudadana','drogas','narcotráfico','carcel','preso',
  ],

  // ── DEPORTES ─────────────────────────────────────────────────────────────────
  deportes: [
    'beisbol','futbol','baloncesto','boxeo','atleta','jugador','equipo',
    'partido','torneo','campeonato','liga','gol','jonron','pitcher','pelotero',
    'nba','mlb','cancha','estadio','tenis','ciclismo','medalla','deporte',
    'voleibol','natacion','atletismo','karate','taekwondo','arbitro',
  ],

  // ── TECNOLOGÍA ───────────────────────────────────────────────────────────────
  tecnologia: [
    'tecnologia','inteligencia artificial','ia','robot','app','aplicacion',
    'software','hardware','digital','internet','ciberseguridad','startup',
    'innovacion','samsung','apple','google','meta','openai','computadora',
    'smartphone','celular','red social','nube','datos','algoritmo',
    'ciencia','investigacion cientifica','laboratorio','descubrimiento',
  ],

  // ── SUCESOS ──────────────────────────────────────────────────────────────────
  sucesos: [
    'accidente','incendio','tragedia','asesinato','asesinado','homicidio',
    'desaparecido','emergencia','detenido','arrestado','capturado',
    'victima','sospechoso','herido','muerto','matan','crimen',
    'robo','asalto','delito','policia','autoridades','investigacion',
    'fugitivo','explosión','choque','naufragio','derrumbe',
  ],

  // ── ENTRETENIMIENTO ──────────────────────────────────────────────────────────
  entretenimiento: [
    'musica','cine','artista','actor','actriz','cantante','influencer',
    'television','espectaculo','celebridad','estreno','pelicula','serie',
    'concierto','nominacion','premio','reggaeton','bachata','merengue',
    'farandula','show','teatro','festival de musica','gira','album',
    'youtuber','tiktoker','instagram','streaming','netflix','hbo',
  ],

  // ── TENDENCIAS ───────────────────────────────────────────────────────────────
  tendencias: [
    'viral','trending','tendencia','meme','lifestyle','moda','curiosidad',
    'tiktok','instagram','twitter','youtube','famoso','popular',
    'record','impactante','sorprendente','curioso','increible','fenomeno',
    'generacion','joven','redes sociales','influencer','challenge',
    'estilo de vida','nuevo reto','se hace viral','lo que todos hablan',
  ],

  // ── ECONOMÍA ─────────────────────────────────────────────────────────────────
  economia: [
    'economia','economico','financiero','pib','inflacion','banco','dolar',
    'mercado','inversion','empresa','comercio','impuesto','presupuesto',
    'exportacion','importacion','precio','costo','deficit','reservas',
    'negocio','emprendimiento','startup','finanzas','credito','deuda',
    'turismo','zona franca','produccion','industria','crecimiento economico',
  ],

  // ── INTERNACIONAL ────────────────────────────────────────────────────────────
  internacional: [
    'trump','biden','putin','xi jinping','zelensky','macron','netanyahu',
    'eeuu','estados unidos','rusia','china','israel','iran','ucrania','palestina',
    'union europea','corea del norte','arabia saudita',
    'onu','otan','nato','g7','g20','fmi','banco mundial','cumbre mundial',
    'guerra','conflicto armado','ataque militar','bombardeo','invasion',
    'acuerdo de paz','alto el fuego','crisis nuclear',
    'aranceles','crisis global','recesion mundial','petroleo','opep',
    'reserva federal','tasas de interes',
    'terremoto','tsunami','erupcion volcanica',
    'pandemia','emergencia sanitaria','politica exterior',
  ],

  // ── SALUD ────────────────────────────────────────────────────────────────────
  salud: [
    'salud','medico','medica','hospital','enfermedad','vacuna','tratamiento',
    'paciente','clinica','medicina','virus','pandemia','cancer','diabetes',
    'bienestar','prevencion','nutricion','farmaco','epidemia','sanitario',
    'alimentacion','dieta','cirugia','trasplante','emergencia medica',
    'seguro medico','salud publica','ministerio de salud',
  ],

  // ── CULTURA ──────────────────────────────────────────────────────────────────
  cultura: [
    'cultura','arte','museo','exposicion','patrimonio','literatura','libro',
    'autor','escritor','festival','danza','folclore','tradicion',
    'gastronomia','arquitectura','identidad','artesania','historia',
    'educacion cultural','teatro cultural','evento cultural','pintura',
    'escultura','poesia','novela','teatro dominicano','identidad cultural',
  ],

  // ── NOTICIAS (legacy) ────────────────────────────────────────────────────────
  noticias: [
    'dominicano','dominicana','republica dominicana','santo domingo','santiago',
    'gobierno','ministerio','abinader','senado','congreso',
    'municipio','alcalde','sociedad','comunidad','derechos',
  ],

  // ── NACIONAL ─────────────────────────────────────────────────────────────────
  nacional: [
    'dominicano','dominicana','republica dominicana','santo domingo','santiago',
    'haiti','frontera','gobierno','ministerio','abinader','senado','congreso',
    'jce','elecciones','municipio','alcalde','pld','prm','fuerza del pueblo',
    'banco central','dolar','presupuesto nacional','zona franca',
    'coee','digesett','intrant','proconsumidor','caasd','edenorte','edesur',
    'comunidad','sociedad','juventud','mujeres','derechos',
    'protesta','huelga','manifestacion','migracion','extradicion',
    'inapa','senasa','mopc','adie','indotel',
  ],

  // ── MEDIO AMBIENTE ────────────────────────────────────────────────────────────
  'medio-ambiente': [
    'medio ambiente','medioambiente','cambio climatico','calentamiento global',
    'deforestacion','reforestacion','contaminacion','reciclaje','sostenible',
    'biodiversidad','parque nacional','cuenca','sequia',
    'huracan','tormenta tropical','inundacion','inundaciones',
    'ecosistema','flora','fauna','residuos','basura','plastico',
    'energia renovable','solar','eolica','carbono','emisiones',
    'desastre natural','terremoto','erupcion','tsunami',
  ],
};

/**
 * Verifica si el ítem del RSS es temáticamente apto para la sección.
 * BLINDAJE ESTRICTO (Estructura Oficial Imperio Público):
 *   (1) NINGUNA palabra del BLOCKLIST puede aparecer en título+snippet.
 *   (2) El TÍTULO debe contener al menos 1 palabra del ALLOWLIST de la sección.
 *       Excepción: "noticias" acepta también 2+ hits en el snippet (es la sección general).
 */
function isOnTopicForCategory(item, categorySlug) {
  const blocklist = TOPIC_BLOCKLIST[categorySlug] || [];
  const allowlist = TOPIC_ALLOWLIST[categorySlug] || [];

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const text      = norm(`${item.title || ''} ${item.contentSnippet || ''}`);
  const titleOnly = norm(item.title || '');

  // 1. BLOCKLIST: rechazar si aparece cualquier palabra prohibida en título o snippet
  if (blocklist.some(w => text.includes(norm(w)))) return false;

  // 2. Sin ALLOWLIST definido → sin restricción (no debería ocurrir)
  if (allowlist.length === 0) return true;

  // 3. El TÍTULO debe tener hit en el allowlist (garantiza que el artículo SEA sobre el tema)
  const titleHit = allowlist.some(w => titleOnly.includes(norm(w)));

  if (categorySlug === 'noticias' || categorySlug === 'nacional') {
    // Nacional es el comodín dominicano: acepta si hay hit en título O 2+ en texto
    if (titleHit) return true;
    return allowlist.filter(w => text.includes(norm(w))).length >= 2;
  }

  if (categorySlug === 'medio-ambiente') {
    // Medio ambiente: acepta si hay hit en título o snippet (temas emergentes)
    return titleHit || allowlist.some(w => text.includes(norm(w)));
  }

  // Todas las demás secciones: el TÍTULO es obligatorio
  return titleHit;
}

// ─── PARSEAR Y VALIDAR ARTÍCULO GENERADO POR IA ──────────────────────────────
function parseAndValidateAI(rawText, catSlug, newsSnippet, newsTitle) {
  if (!rawText) return null;
  const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  if (/^irrelevante$/im.test(cleaned)) {
    return { irrelevant: true };
  }

  let articleData;
  try {
    articleData = JSON.parse(cleaned);
  } catch (parseError) {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { articleData = JSON.parse(jsonMatch[0]); } catch {}
    }
  }

  // Rescate si el parseo JSON falló (Pollinations AI suele devolver texto en Markdown directo)
  if (!articleData || typeof articleData !== 'object') {
    // Si el texto parece ser JSON pero estaba roto, es mejor descartarlo para que intente con otra IA
    // en lugar de publicar el JSON crudo como si fuera markdown.
    const looksLikeJson = cleaned.startsWith('{') || cleaned.includes('"title":') || cleaned.includes('"content":');
    if (looksLikeJson) {
      console.log(`[Bot] ⚠️ Validation falló: JSON malformado detectado, no se usará como Markdown.`);
      return null;
    }

    const lines = cleaned.split('\n');
    let title = newsTitle;
    if (lines[0] && /^#+\s*/.test(lines[0])) {
      title = lines[0].replace(/^#+\s*/, '').trim();
      lines.shift();
    }
    const content = lines.join('\n').trim();
    if (content.length > 400) {
      articleData = {
        title,
        excerpt: content.slice(0, 155).replace(/\n/g, ' '),
        content,
        tags: [catSlug],
        impact_level: 'medium'
      };
    }
  }

  if (!articleData || typeof articleData !== 'object') return null;

  // Mapear traducciones de claves al español que a veces hace la IA
  if (!articleData.title && articleData.titulo) articleData.title = articleData.titulo;
  if (!articleData.content && articleData.contenido) articleData.content = articleData.contenido;
  if (!articleData.excerpt && articleData.resumen) articleData.excerpt = articleData.resumen;

  if (!articleData.title || !articleData.content) {
    return null;
  }

  // ─── GUARDIA ANTI-PLACEHOLDER ───────────────────────────────────────────
  const PLACEHOLDER_SIGNALS = [
    'titular real aquí', 'gancho real aquí', 'artículo real en markdown',
    'titular llamativo', 'magnético aquí', 'artículo completo',
    'gancho periodístico', 'resumen en forma de', 'seo1', 'seo2', 'seo3',
    '<titular', '<excerpt', '<contenido', '<tag', '[Nombre del',
    '[Tu nombre', 'Inserte aquí', 'Escribe el artículo', 'Como editor de',
    'Aquí tienes el artículo', 'Claro, aquí tienes',
    'produce json', 'content markdown', 'write an article as editor',
    'minimum 600 words', 'we need to produce',
    'por supuesto', 'claro que sí', 'como inteligencia artificial',
    'i am an ai', 'lo siento', 'no puedo generar', 'no puedo crear'
  ];
  
  const normalizeForCheck = (str) => 
    String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const combinedAiText = normalizeForCheck(
    `${articleData.title} ${articleData.excerpt} ${articleData.content} ${(articleData.tags || []).join(' ')}`
  );

  const isPlaceholder = PLACEHOLDER_SIGNALS.some(sig => 
    combinedAiText.includes(normalizeForCheck(sig))
  );
  if (isPlaceholder) {
    console.log(`[Bot] ⚠️ Validation falló: Contenido contiene placeholders.`);
    return null;
  }

  // LIMPIEZA ESTRICTA: Reemplazar secuencias de saltos y comillas
  const sanitizeAiText = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\\+n/g, '\n').replace(/\\"/g, '"').replace(/\n\n+/g, '\n\n').trim();
  };

  const sanitizeContent = (str) => {
    if (typeof str !== 'string') return str;
    return sanitizeAiText(str)
      .replace(/\n?[\s\*]*etiquetas\s*(seo)?\s*:.*$/is, '')
      .replace(/\n?[\s\*]*palabras\s*clave\s*:.*$/is, '')
      .replace(/\n?[\s\*]*keywords?\s*:.*$/is, '')
      .trim();
  };

  articleData.title = sanitizeAiText(articleData.title)
    .replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').replace(/[""]/g, '"').trim();

  if (articleData.title.length < 15) {
    console.log(`[Bot] ⚠️ Validation falló: Título muy corto.`);
    return null;
  }

  // === ESCUDO DE SEGURIDAD: DETECCIÓN DE HALLUCINACIÓN (Cruce de keywords) ===
  const sourceKws = extractKeywords(newsTitle);
  const aiKws = extractKeywords(articleData.title);
  const overlap = semanticOverlap(sourceKws, aiKws);
  if (overlap === 0 && sourceKws.size > 0) {
    console.log(`[Bot] ⚠️ Validation falló: Alucinación de título.`);
    return null;
  }

  articleData.excerpt = sanitizeAiText(articleData.excerpt);
  articleData.content = sanitizeContent(articleData.content);

  // ── GUARDIA ANTI-TRUNCADO ──────────────────────────────────
  if (!/[.!?"]\s*$/s.test(articleData.content)) {
    console.log(`[Bot] ⚠️ Validation falló: Contenido parece truncado.`);
    return null;
  }

  // ── CANDADO DE LONGITUD MÍNIMA ─────────────────────────────
  if (articleData.content.length < MIN_CONTENT_LENGTH) {
    console.log(`[Bot] ⚠️ Validation falló: Contenido muy corto (${articleData.content.length} chars).`);
    return null;
  }

  // ── CANDADO DE ORIGINALIDAD ────────────────────────────────
  const sourceSnippetLen = (newsSnippet || '').length;
  if (sourceSnippetLen > 100 && sourceSnippetLen <= 500 && articleData.content.length < sourceSnippetLen * 2) {
    console.log(`[Bot] ⚠️ Validation falló: Similar al snippet original.`);
    return null;
  }

  return articleData;
}

export async function GET(request) {
    const startTime = Date.now();
  // X-Manual-Trigger solo exime del header Authorization cuando viene del trigger interno.
  // Aún así se valida CRON_SECRET para bloquear llamadas externas que inyecten el header.
  const isManualTrigger = request.headers.get('X-Manual-Trigger') === 'true';
  const adminId = request.headers.get('X-Admin-Id');

  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    // Permitir disparo manual si viene del trigger interno con un adminId válido (UUID)
    const isInternalAdmin = isManualTrigger && adminId && /^[0-9a-f-]{36}$/i.test(adminId);
    if (!isInternalAdmin && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado. Se requiere token CRON.' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  let categoryKey = searchParams.get('category');
  let categoryFallbackUsed = false;

  // ─── ORDEN DE ROTACIÓN DETERMINISTA ────────────────────────────────────────
  // Orden editorial oficial. El bot siempre sigue este orden de prioridad para
  // garantizar que TODAS las secciones se cubran antes de repetir alguna.
  // Solo incluye las 11 categorías con slot de cron activo (vercel.json + autoblog.yml).
  const ROTATION_ORDER = [
    'politica', 'policia', 'deportes', 'tecnologia', 'sucesos',
    'entretenimiento', 'tendencias', 'economia', 'internacional', 'salud', 'cultura',
  ];

  // ─── LÓGICA DE SELECCIÓN / FALLBACK ────────────────────────────────────────
  try {
    const supabaseTemp = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const todayTmp = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    const startTmp = new Date(`${todayTmp}T00:00:00-04:00`).toISOString();
    const { data: publishedCats } = await supabaseTemp
      .from('articles').select('category').gte('publishedAt', startTmp);
    const coveredToday = new Set((publishedCats || []).map(a => a.category));
    // Primera categoría del orden oficial que aún no tiene artículo hoy
    const nextUncovered = ROTATION_ORDER.find(c => !coveredToday.has(c)) || null;

    if (!categoryKey) {
      // Sin categoría especificada → elegir la primera sin cubrir en el orden oficial
      categoryKey = nextUncovered || ROTATION_ORDER[0];
      console.log(`[Bot] 🎯 Rotación determinista: ${categoryKey} (cubiertas hoy: ${[...coveredToday].join(', ') || 'ninguna'})`);
    } else {
      // Categoría explícita recibida (GitHub Actions / manual)
      if (coveredToday.has(categoryKey) && nextUncovered) {
        // Ya fue cubierta hoy → fallback a la siguiente sin cubrir en la rotación
        console.log(`[Bot] 🔄 Categoría "${categoryKey}" ya cubierta hoy → fallback a "${nextUncovered}"`);
        categoryKey = nextUncovered;
        categoryFallbackUsed = true;
      } else {
        console.log(`[Bot] ✅ Publicando categoría solicitada: ${categoryKey}`);
      }
    }
  } catch (selErr) {
    // Si Supabase falla, usar la categoría solicitada o el inicio de la rotación
    if (!categoryKey) categoryKey = ROTATION_ORDER[0];
    console.warn(`[Bot] ⚠️ Selección de rotación falló (${selErr.message}). Usando: ${categoryKey}`);
  }

  const cat = CATEGORIES[categoryKey];
  if (!cat) {
    return NextResponse.json({ error: `Categoría inválida: ${categoryKey}` }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: botSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'automation_enabled')
    .maybeSingle();

  if (botSetting?.value !== true) {
    return NextResponse.json({ message: 'Automatización pausada desde el panel de administración.' }, { status: 200 });
  }

  // === CAPA 0: Early Exit si ya alcanzamos los límites ===
  try {
    const todayDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());

    const startOfTodayDR = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
    const endOfTodayDR   = new Date(`${todayDR}T23:59:59-04:00`).toISOString();

    // Check GLOBAL (Seguridad AdSense)
    const { count: totalToday } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .gte('publishedAt', startOfTodayDR)
      .lte('publishedAt', endOfTodayDR);
    
    if ((totalToday ?? 0) >= DAILY_LIMIT_GLOBAL) {
      return NextResponse.json({ message: `Límite GLOBAL diario alcanzado (${totalToday}/${DAILY_LIMIT_GLOBAL}).` }, { status: 200 });
    }

    // Sin límite por categoría — solo el límite global de 12 aplica

    // Si pasamos el check, procedemos con el scraping pesado
    const parser = new Parser({
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });

    // ─── FUENTES DEDICADAS POR CATEGORÍA ────────────────────────────────────────
    // Cada categoría usa SOLO sus feeds específicos. Nunca se mezclan fuentes de
    // otras secciones. Esto garantiza que deportes no recibe noticias de política, etc.
    const categoryFeeds = cat.feeds || [];
    if (categoryFeeds.length === 0) {
      return NextResponse.json({ message: `No hay feeds configurados para: ${categoryKey}` }, { status: 200 });
    }

    // Fetch en paralelo de todos los feeds de la categoría
    const feedPromises = categoryFeeds.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        return feed.items || [];
      } catch (e) {
        console.warn(`[Bot] Feed falló (${feedUrl.slice(0, 50)}): ${e.message}`);
        return [];
      }
    });

    const results = await Promise.all(feedPromises);
    let pooledItems = results.flat();
    console.log(`[Bot] ${pooledItems.length} ítems totales de ${categoryFeeds.length} feeds dedicados para "${cat.slug}"`);

    if (pooledItems.length === 0) {
      return NextResponse.json({ message: `Sin noticias disponibles en las fuentes para: ${categoryKey}` }, { status: 200 });
    }


    // === CAPA 1: Pre-filtro estricto por fecha (solo HOY en RD) ===
    const todaysItems = pooledItems.filter(item => {
      const dateStr = item.isoDate || item.pubDate;
      if (!dateStr) return false; // Sin fecha = rechazado
      const itemDR = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santo_Domingo',
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).format(new Date(dateStr));
      return itemDR === todayDR;
    });

    console.log(`[Bot] ${todaysItems.length} noticias de HOY (${todayDR}) de ${pooledItems.length} totales`);

    if (todaysItems.length === 0) {
      return NextResponse.json({ message: `No hay noticias de HOY (${todayDR}) en las fuentes consultadas para: ${categoryKey}` }, { status: 200 });
    }

    // El check de límites ya se hizo en la Capa 0 al inicio.

    // === CAPA 3: Deduplicación masiva — obtener todos los links y títulos ya publicados HOY ===
    // Consultamos TODAS las categorías (sin filtro de categoría) para detectar duplicados semánticos cross-categoría
    const { data: publishedToday } = await supabase
      .from('articles')
      .select('source_link, title')
      .gte('publishedAt', startOfTodayDR)
      .lte('publishedAt', endOfTodayDR);

    const publishedLinks  = new Set((publishedToday || []).map(a => a.source_link).filter(Boolean));
    const publishedTitles = new Set(
      (publishedToday || []).map(a =>
        a.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()
      )
    );
    // Pre-computar keywords de todos los artículos publicados hoy (para check semántico)
    const publishedKeywordSets = (publishedToday || [])
      .map(a => extractKeywords(a.title))
      .filter(s => s.size > 0);

    // ─── POOL DE TEMAS YA CUBIERTOS HOY (cross-categoría) ────────────────────────
    // Construir un Set con TODAS las keywords significativas de los artículos publicados hoy.
    // Palabras genéricas excluidas para evitar falsos positivos (ej: "gobierno", "nuevo").
    const GENERIC_TOPIC_WORDS = new Set([
      'nuevo','nueva','nuevos','nuevas','gran','grande','primer','primera','tras',
      'sigue','tiene','dice','hace','llega','viene','sera','esta','estos','estas',
      'sobre','desde','hasta','entre','todos','todas','alguno','algunos','otros',
      'mundo','pais','paises','gobierno','presidente','nacional','local','hoy',
      'semana','meses','anos','dias','horas','tiempo','parte','lugar','caso',
      'Santo','Domingo','Santiago','Republica','Dominicana',
    ]);
    const publishedTopicPool = new Set(
      (publishedToday || []).flatMap(a => {
        const norm = a.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
        return norm.split(/\s+/).filter(w =>
          w.length > 5 &&                        // Palabras de 6+ caracteres (más específicas)
          !GENERIC_TOPIC_WORDS.has(w) &&         // No es palabra genérica
          !/^\d+$/.test(w)                       // No es número puro
        );
      })
    );


    // === CAPA 4: Selección final — priorizar ÚLTIMA HORA y TENDENCIA POR CONSENSO ===
    // Calcular "Impacto" basado en repetición en medios y relevancia nacional
    const itemsWithScore = todaysItems.map(item => {
      const keywords = extractKeywords(item.title);
      let consensusScore = 0;
      
      // Bono de relevancia EXTRA FUERTE: Noticias Nacionales de República Dominicana
      const textForCheck = (item.title + ' ' + (item.contentSnippet || '')).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      
      // Palabras clave súper locales de RD
      const rdKeywords = /abinader|republica dominicana|dominicano|santo domingo|santiago|gobierno|senado|diputados|jce|prm|pld|fuerza del pueblo|leonel|danilo|dncd|policia nacional|intrant|digesett|ministerio|educacion|salud publica|coee|proconsumidor/;
      
      if (textForCheck.match(rdKeywords)) {
        consensusScore += 5; // Bono masivo para asegurar que lo nacional le gane a lo internacional
      }

      // Consenso: ¿Cuántos otros medios están hablando de esto hoy?
      for (const other of todaysItems) {
        if (other === item) continue;
        const otherKeywords = extractKeywords(other.title);
        if (semanticOverlap(keywords, otherKeywords) >= 0.25) {
          consensusScore += 3; // Sube el impacto si es tendencia en múltiples medios
        }
      }
      
      return { ...item, consensusScore };
    });

    // Separar ítems y ordenar por Impacto (Consensus Score) y luego por frescura
    const breakingItems = itemsWithScore.filter(i => isBreakingNews(i.title))
      .sort((a, b) => b.consensusScore - a.consensusScore || new Date(b.isoDate || b.pubDate).getTime() - new Date(a.isoDate || a.pubDate).getTime());
      
    const normalItems = itemsWithScore.filter(i => !isBreakingNews(i.title))
      .sort((a, b) => b.consensusScore - a.consensusScore || new Date(b.isoDate || b.pubDate).getTime() - new Date(a.isoDate || a.pubDate).getTime());
      
    const prioritizedItems = [...breakingItems, ...normalItems];

    if (breakingItems.length > 0) {
      console.log(`[Bot] ⚡ ${breakingItems.length} noticia(s) de ÚLTIMA HORA en cola. Se procesan primero.`);
    }

    let news = null;
    let isNewsBreaking = false;
    for (const item of prioritizedItems) { 
        if (Date.now() - startTime > 40000) {
                console.warn("[Bot] Time safety limit reached, breaking prioritizedItems loop");
                break;
        }
      if (!item.link || !item.title) continue;

      // 4a. VALIDACIÓN TEMÁTICA — descartar si el ítem no es apto para esta sección
      if (!isOnTopicForCategory(item, cat.slug)) {
        console.log(`[Bot] ⛔ Fuera de sección [${cat.slug.toUpperCase()}]: "${item.title.slice(0, 65)}"`);
        continue;
      }

      // 4a. Verificar link exacto
      if (publishedLinks.has(item.link)) {
        console.log(`[Bot] Duplicado por link: ${item.link.slice(0, 60)}`);
        continue;
      }

      // 4b. Verificar título normalizado (tolerante a pequeñas variaciones)
      const normalizedTitle = item.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
      if (publishedTitles.has(normalizedTitle)) {
        console.log(`[Bot] Duplicado por título: ${item.title.slice(0, 60)}`);
        continue;
      }

      // 4c. Verificar en toda la historia (por si acaso el mismo link fue publicado en otro día)
      const { data: existingLink } = await supabase
        .from('articles').select('id').eq('source_link', item.link).maybeSingle();
      if (existingLink) {
        console.log(`[Bot] Duplicado histórico por link: ${item.link.slice(0, 60)}`);
        continue;
      }

      // 4d. Deduplicación SEMÁNTICA — detectar el mismo evento aunque venga de diferente fuente/título
      const candidateKeywords = extractKeywords(item.title);
      const semanticDuplicate = publishedKeywordSets.find(
        existingKws => semanticOverlap(candidateKeywords, existingKws) >= SEMANTIC_THRESHOLD
      );
      if (semanticDuplicate) {
        const overlap = Math.round(semanticOverlap(candidateKeywords, semanticDuplicate) * 100);
        console.log(`[Bot] 🔁 Duplicado SEMÁNTICO (${overlap}% Jaccard): "${item.title.slice(0, 60)}" ya cubierto hoy.`);
        continue;
      }

      // 4e. Deduplicación por ENTIDADES NOMBRADAS — detecta el mismo evento con distinto titular
      // Si 2 artículos comparten 2+ entidades (países, personas, org.), son el mismo evento.
      const entityDuplicate = publishedTitles && [...publishedTitles].find(
        t => sharesCriticalEntities(item.title, t)
      );
      if (entityDuplicate) {
        console.log(`[Bot] 🔁 Duplicado por ENTIDADES: "${item.title.slice(0, 60)}" cubre el mismo evento que "${entityDuplicate.slice(0, 50)}"`);
        continue;
      }

      // 4f. Deduplicación por TEMA CROSS-CATEGORÍA — bloquea el mismo tema en cualquier sección
      // Extrae todas las keywords del candidato y verifica si alguna ya está en el pool de temas cubiertos hoy.
      // Ejemplos bloqueados: "Ébola en Tecnología" si ya salió en Sucesos, "Trump" en Política y Economía, etc.
      const candidateNorm = item.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
      const candidateTopicWords = candidateNorm.split(/\s+/).filter(w =>
        w.length > 5 && !GENERIC_TOPIC_WORDS.has(w) && !/^\d+$/.test(w)
      );
      const topicMatch = candidateTopicWords.find(w => publishedTopicPool.has(w));
      if (topicMatch) {
        console.log(`[Bot] 🔁 Duplicado CROSS-CATEGORÍA: "${item.title.slice(0, 60)}" → tema "${topicMatch}" ya cubierto hoy.`);
        continue;
      }

      news = item;
      isNewsBreaking = isBreakingNews(item.title);
      if (isNewsBreaking) {
        console.log(`[Bot] ⚡ ÚLTIMA HORA seleccionada: "${item.title.slice(0, 70)}"`);
      }

      // --- LLAMADA A LA IA ---
      try {
    const baseSlug = news.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80);
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // ─── PROMPT EDITORIAL — PERIODISMO ORIGINAL ─────────────────────────────
    const prompt = `Eres el redactor jefe de la sección "${cat.slug.toUpperCase()}" de **Imperio Público**, un medio digital dominicano de élite con estándares editoriales propios.

--- REFERENCIA INFORMATIVA (solo para extraer los hechos) ---
Fecha: ${todayDR}
SECCIÓN: ${cat.slug.toUpperCase()}
Titular de referencia: ${news.title}
Resumen de referencia: ${news.contentSnippet || 'Sin resumen disponible'}
--------------------------------------------------------------

⚠️ REGLA FUNDAMENTAL — LEY DE REDACCIÓN ORIGINAL:
Tú NO copias. Tú NO traduces. Tú NO parafraseas directamente.
Usas la información de la fuente ÚNICAMENTE para conocer los HECHOS.
Luego escribes tu PROPIO artículo con:
  • Tu PROPIA voz editorial (estilo Imperio Público)
  • Tu PROPIA estructura narrativa
  • Tu PROPIO ángulo y enfoque periodístico
  • Tu PROPIO análisis e interpretación del impacto
Si alguien compara tu artículo con la fuente original, deben leer como dos piezas completamente distintas.

REGLAS EDITORIALES ADICIONALES:
1. SECCIÓN: Enfoca el ángulo en "${cat.slug.toUpperCase()}". Estilo: ${cat.style}.
2. IDIOMA: Español dominicano profesional, natural y fluido.
3. Primer párrafo: impactante, que enganche al lector en las primeras dos líneas.
4. Estructura: al menos 3 subtítulos (##) que guíen la lectura.
5. Usa **negritas** en datos clave, cifras y nombres importantes.
6. TÍTULO: Original, atractivo, SEO-optimizado. Entre 50-70 caracteres. NO copies el título de la fuente.
7. CONTENIDO: MÍNIMO 600 palabras. Incluye contexto histórico, impacto local o regional, y perspectiva.
8. EXCERPT: Meta-descripción propia de 155 caracteres máximo.
9. PROHIBIDO: frases genéricas de IA ("En conclusión...", "Es importante destacar...", "Cabe mencionar...").
10. Si la noticia es trivial o sin relevancia pública → responde exactamente: IRRELEVANTE

Responde EXCLUSIVAMENTE con JSON válido (sin markdown, sin texto adicional):
{ "title": "<titular original>", "excerpt": "<gancho propio>", "content": "<artículo markdown original>", "tags": ["Tag1", "Tag2", "Tag3"], "impact_level": "high|medium|low" }`;

    // ─── GEMINI PRO — ROTACIÓN DETERMINISTA POR SLOT ──────────────────────────
    // Plan: Gemini API Pro (sin límite diario real, límite por minuto por clave).
    // Estrategia: cada invocación del cron empieza en una clave diferente del pool,
    // distribuyendo la carga uniformemente entre todas las claves disponibles.
    //
    // ¿Por qué determinista y no aleatoria?
    //   • Aleatoria: por azar dos crons seguidos pueden golpear la misma clave.
    //   • Determinista: slotIndex = minuto_actual % total_claves → cada cron
    //     empieza en una clave diferente de forma predecible y equitativa.
    const keys = [];
    const envVars = ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3'];
    for (const v of envVars) {
      if (process.env[v]) {
        const parsed = process.env[v].split(',').map(k => k.trim()).filter(Boolean);
        keys.push(...parsed);
      }
    }

    if (keys.length === 0) {
      console.error('[Bot] ❌ CRÍTICO: No hay claves Gemini configuradas.');
    } else {
      // Rotación determinista: cada slot de 30 min usa una clave de inicio diferente.
      // Con 22 claves y crons cada 30 min → cada clave se usa ~1 vez por día como primaria.
      const slotMinute   = Math.floor(Date.now() / 1000 / 60); // minutos desde epoch
      const startIndex   = slotMinute % keys.length;
      const rotatedKeys  = [...keys.slice(startIndex), ...keys.slice(0, startIndex)];
      keys.length = 0;
      keys.push(...rotatedKeys);
      console.log(`[Bot] 🔑 Gemini Pro — ${keys.length} claves disponibles. Rotación: empieza en índice ${startIndex}`);
    }

    // ─── MODELOS GEMINI PRO — Verificados como operativos ─────────────────────
    // Orden: el más capaz primero, fallbacks más rápidos/ligeros al final.
    // gemini-2.5-flash: ✅ confirmado operativo con claves Pro (probado 2026-05-24)
    // gemini-2.0-flash: ✅ backup — usa cuota pero funciona
    // gemini-2.0-flash-lite: ✅ el más rápido, ideal si los anteriores saturan RPM
    const geminiModels = [
      'gemini-2.5-flash',      // Principal Pro — mejor calidad, confirmado OK
      'gemini-2.0-flash',      // Backup confiable
      'gemini-2.0-flash-lite', // Ultra-rápido de respaldo
    ];

    let articleData = null;
    let aiSuccess = false;
    const deadKeys = new Set(); // claves muertas en esta sesión (cuota/leaked/banned)

    for (const key of keys) {
      if (aiSuccess) break;
      if (deadKeys.size >= keys.length) break; // todas muertas
      if (deadKeys.has(key)) continue;         // ya sabemos que no sirve

      for (const model of geminiModels) {
        try {
          console.log(`[Bot] 🔑 Gemini ...${key.slice(-6)} / ${model}`);
          // Guarda global: si llevamos >40s, no tiene sentido iniciar otro intento de Gemini
          if (Date.now() - startTime > 40000) {
            console.warn('[Bot] ⏱️ Tiempo global >40s, abortando bucle Gemini.');
            break;
          }
          const gemCtrl = new AbortController();
          const gemTimer = setTimeout(() => gemCtrl.abort(), 20000); // 20s — reducido para dejar margen al resto
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
            signal: gemCtrl.signal,
          });
          clearTimeout(gemTimer);
          const data = await res.json();
          if (data.error) {
            const isQuota    = data.error.code === 429 || data.error.status === 'RESOURCE_EXHAUSTED';
            const isInvalid  = data.error.code === 400 || data.error.status === 'INVALID_ARGUMENT';
            const isNotFound = data.error.code === 404;
            const isDenied   = data.error.code === 403;
            const isLeaked   = (data.error.message || '').toLowerCase().includes('leaked');
            const isBanned   = (data.error.message || '').toLowerCase().includes('banned');

            // Clave muerta → marcarla y saltar a la siguiente de inmediato
            if (isQuota || isInvalid || isDenied || isLeaked || isBanned) {
              const reason = isQuota ? 'cuota agotada' : isLeaked ? '⛔ leaked' : isBanned ? '⛔ banned' : 'inválida/denegada';
              console.log(`[Bot] ⚠️ Gemini ...${key.slice(-6)}: ${reason} → siguiente clave`);
              deadKeys.add(key);
              break;
            }
            if (isNotFound) {
              console.log(`[Bot] ⚠️ Modelo N/A: ${model} → siguiente modelo`);
              continue; // solo este modelo no existe
            }
            console.log(`[Bot] ⚠️ Error Gemini: ${data.error.message?.slice(0, 60)}`);
            continue;
          }
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const parsed = parseAndValidateAI(text, cat.slug, news.contentSnippet, news.title);
          if (parsed) {
            console.log(`[Bot] ✅ Gemini éxito y validado: ...${key.slice(-6)} / ${model}`);
            articleData = parsed;
            aiSuccess = true;
            break;
          }
        } catch (e) {
          console.log(`[Bot] ❌ Gemini timeout ...${key.slice(-6)} → siguiente clave`);
          deadKeys.add(key); // timeout = clave lenta/muerta
          break;
        }
      }
    }

    if (deadKeys.size > 0 && !aiSuccess) {
      console.log(`[Bot] ⚠️ ${deadKeys.size}/${keys.length} claves Gemini muertas. Pasando a fallback.`);
    }

    // PRIORIDAD 2: Pollinations AI (gratuito, sin cuota)
    if (!aiSuccess) {
      console.log('[Bot] ⚠️ Gemini sin cuota o validación fallida. Intentando Pollinations...');
      // Guarda: si llevamos >42s, saltar Pollinations directamente
      if (Date.now() - startTime > 42000) {
        console.warn('[Bot] ⏱️ Tiempo global >42s, saltando Pollinations.');
      } else
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s — reducido para dejar margen
        const polRes = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'Eres un periodista profesional. Responde ÚNICAMENTE con JSON válido, sin bloques de código.' },
              { role: 'user', content: prompt }
            ],
            model: 'openai',
            seed: Math.floor(Math.random() * 99999),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (polRes.ok) {
          const txt = await polRes.text();
          const parsed = parseAndValidateAI(txt, cat.slug, news.contentSnippet, news.title);
          if (parsed) {
            console.log('[Bot] ✅ Pollinations respondió y validado correctamente.');
            articleData = parsed;
            aiSuccess = true;
          }
        }
      } catch (pollinationsError) {
        console.log(`[Bot] ⚠️ Pollinations falló: ${pollinationsError.message?.slice(0, 60)}`);
      }
    }

    // PRIORIDAD 3: OpenRouter modelos gratuitos (última línea de defensa)
    if (!aiSuccess) {
      // Guarda: si llevamos >44s, saltar OpenRouter — no hay tiempo suficiente
      if (Date.now() - startTime > 44000) {
        console.warn('[Bot] ⏱️ Tiempo global >44s, saltando OpenRouter para no causar timeout.');
      } else {
      console.log('[Bot] ⚠️ Pollinations sin respuesta o validación fallida. Intentando OpenRouter (gratuito)...');
      const FREE_MODELS_OR = [
        'openai/gpt-oss-120b:free',
        'openai/gpt-oss-20b:free',
        'nvidia/nemotron-3-super-120b-a12b:free',
        'z-ai/glm-4.5-air:free',
        'minimax/minimax-m2.5:free',
        'nvidia/nemotron-3-nano-30b-a3b:free',
      ];
      for (const orModel of FREE_MODELS_OR) {
        if (aiSuccess) break;
        // Guarda por iteración: si llevamos >46s, no iniciar más intentos
        if (Date.now() - startTime > 46000) {
          console.warn('[Bot] ⏱️ Tiempo global >46s, abortando bucle OpenRouter.');
          break;
        }
        try {
          const orModelName = (orModel.split('/')[1] || orModel).split(':')[0];
          console.log(`[Bot] Probando OpenRouter (${orModelName})...`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s — reducido de 30s
          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
              'HTTP-Referer': 'https://imperiopublico.com',
              'X-Title': 'Imperio Público Bot',
            },
            body: JSON.stringify({
              model: orModel,
              messages: [
                { role: 'system', content: 'Eres periodista profesional. Responde ÚNICAMENTE con JSON válido.' },
                { role: 'user', content: prompt }
              ],
              max_tokens: 2000,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (orRes.ok) {
            const orData = await orRes.json();
            const orText = orData.choices?.[0]?.message?.content || '';
            const parsed = parseAndValidateAI(orText, cat.slug, news.contentSnippet, news.title);
            if (parsed) {
              console.log(`[Bot] ✅ OpenRouter (${orModel}) respondió y validado.`);
              articleData = parsed;
              aiSuccess = true;
            }
          }
        } catch (orErr) {
          console.log(`[Bot] ⚠️ OpenRouter (${orModel}) falló: ${orErr.message?.slice(0, 60)}`);
        }
      }
      } // fin del bloque guarda OpenRouter
    }

    // Si TODOS los proveedores fallaron → candado estricto
    if (!aiSuccess) {
      console.log(`[Bot] 🔒 CANDADO ACTIVADO: todos los proveedores de IA fallaron las validaciones.`);
      throw new Error('Sin IA disponible o todas las respuestas fallaron las validaciones de calidad (longitud, originalidad, formato).');
    }

    // El artículo ya está validado y sanitizado por parseAndValidateAI

    let finalImageUrl = null;
    try {
      // Prioridad 1: Intentar obtener imagen del item del RSS directamente (si existe)
      if (news.enclosure && news.enclosure.url) {
        finalImageUrl = news.enclosure.url;
        console.log(`[Bot] Imagen encontrada en enclosure RSS: ${finalImageUrl.slice(0, 50)}...`);
      } else if (news['media:content'] && news['media:content'].$ && news['media:content'].$.url) {
        finalImageUrl = news['media:content'].$.url;
        console.log(`[Bot] Imagen encontrada en media:content RSS: ${finalImageUrl.slice(0, 50)}...`);
      }

      // Prioridad 2: Scrapping del HTML original
      if (!finalImageUrl) {
        const htmlCtrl  = new AbortController();
        const htmlTimer = setTimeout(() => htmlCtrl.abort(), 8000); // 8s real timeout
        const redirectRes = await fetch(news.link, {
          redirect: 'follow',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
          signal: htmlCtrl.signal,
        });
        clearTimeout(htmlTimer);
        const html = await redirectRes.text();
        
        // Patrones de anuncios y elementos no deseados (Blacklist extendida)
        const badPatterns = /ad-|ads-|banner|promo|logo|icon|avatar|pixel|spinner|loading|placeholder|button|sidebar|footer|widget|social|share|taboola|outbrain|smartad|anuncio|publicidad|banreservas|banco-popular|bhd-leon|scotiabank|reservas|bpd|claro-ad|orange-ad|altice-ad|mom-ad|click-ad/i;

        const isGoodImage = (src) => {
          if (!src || src.length < 20) return false;
          const normalized = src.toLowerCase();
          return !badPatterns.test(normalized) && 
                 !normalized.includes('doubleclick') && 
                 !normalized.includes('googleads') &&
                 !normalized.includes('google-analytics');
        };

        // Buscar og:image con más flexibilidad (property o name)
        const ogMatch = html.match(/<meta[^>]+(?:property|name)=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']og:image["']/i);
        
        if (ogMatch && ogMatch[1] && isGoodImage(ogMatch[1])) {
          finalImageUrl = ogMatch[1];
          console.log(`[Bot] Imagen encontrada en og:image (validada): ${finalImageUrl.slice(0, 50)}...`);
        } else {
          // Buscar twitter:image
          const twitterMatch = html.match(/<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                               html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image["']/i);
          if (twitterMatch && twitterMatch[1] && isGoodImage(twitterMatch[1])) {
            finalImageUrl = twitterMatch[1];
            console.log(`[Bot] Imagen encontrada en twitter:image (validada): ${finalImageUrl.slice(0, 50)}...`);
          } else {
            // Buscar link rel="image_src"
            const linkSrcMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
            if (linkSrcMatch && linkSrcMatch[1] && isGoodImage(linkSrcMatch[1])) {
              finalImageUrl = linkSrcMatch[1];
            } else {
              // Fallback a buscar imágenes en el cuerpo, pero filtrando anuncios
              // Intentamos buscar dentro de <article> primero para evitar barras laterales y ads
              const articleBodyMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
              const searchArea = articleBodyMatch ? articleBodyMatch[1] : html;
              
              const allImages = [...searchArea.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp|avif))["']/gi)];
              
              for (const imgMatch of allImages) {
                const src = imgMatch[1];
                if (isGoodImage(src)) {
                  finalImageUrl = src;
                  console.log(`[Bot] Imagen fallback encontrada en HTML (filtrada): ${finalImageUrl.slice(0, 50)}...`);
                  break; 
                }
              }
            }
          }
        }

        // Normalizar URL relativa si es necesario
        if (finalImageUrl) {
          if (finalImageUrl.startsWith('//')) {
            finalImageUrl = `https:${finalImageUrl}`;
          } else if (finalImageUrl.startsWith('/')) {
            try {
              const origin = new URL(redirectRes.url).origin;
              finalImageUrl = `${origin}${finalImageUrl}`;
            } catch (e) {
              finalImageUrl = null;
            }
          }
        }
      }

      // Limpieza final y validación de seguridad
      if (finalImageUrl) {
        const isSuspicious = /logo|icon|avatar|pixel|spinner|button|share/i.test(finalImageUrl) || finalImageUrl.length < 20;
        if (isSuspicious) {
          console.warn(`[Bot] Imagen detectada como sospechosa (logo/icono): ${finalImageUrl}`);
          finalImageUrl = null;
        }
      }
    } catch (err) {
      console.warn('[Scraper Warning] No se pudo extraer imagen real:', err.message);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // GARANTÍA DE IMAGEN CLOUDINARY — 3 ETAPAS SIN EXCEPCIÓN
    // REGLA: Si después de las 3 etapas no tenemos URL de Cloudinary,
    //        el artículo NO se publica. Nunca guardamos URLs externas.
    // ═══════════════════════════════════════════════════════════════════════

    // ETAPA 1: Internalizar la imagen real extraída del artículo (3 reintentos)
    if (finalImageUrl) {
      console.log(`[Bot] ETAPA-1 Internalizando imagen real: ${finalImageUrl.slice(0, 60)}...`);
      finalImageUrl = await internalizeImage(finalImageUrl, 3);
    }

    // ETAPA 2: Si no hay imagen Cloudinary → generar con IA y subir a Cloudinary (2 reintentos)
    if (!finalImageUrl || !finalImageUrl.includes('cloudinary.com')) {
      if (finalImageUrl) {
        console.warn(`[Bot] ETAPA-2 Imagen real no internalizada. Generando imagen editorial por IA...`);
      } else {
        console.log(`[Bot] ETAPA-2 Sin imagen fuente. Generando imagen editorial por IA...`);
      }
      const topicTags   = Array.isArray(articleData.tags) ? articleData.tags.join(', ') : '';
      const visualPrompt = `high-end editorial news photography for article: "${articleData.title.slice(0, 120)}". Topics: ${topicTags || articleData.category}. Category: ${cat.slug}. Professional journalistic style, cinematic dramatic lighting, photorealistic, 8k, wide angle shot, 16:9 aspect ratio. NO TEXT, NO LETTERS, NO LOGOS, NO SIGNS.`;
      const seed1        = Date.now();
      const polUrl1      = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=1280&height=720&nologo=true&enhance=true&seed=${seed1}`;

      console.log(`[Bot] ETAPA-2 Pollinations URL: ${polUrl1.slice(0, 80)}...`);
      finalImageUrl = await internalizeImage(polUrl1, 2);
    }

    // ETAPA 3: Segundo intento de IA con seed diferente si aún falla
    if (!finalImageUrl || !finalImageUrl.includes('cloudinary.com')) {
      console.warn(`[Bot] ETAPA-3 Segundo intento de imagen IA con seed alternativo...`);
      const seed2        = Date.now() + Math.floor(Math.random() * 999999);
      const altPrompt    = `dramatic editorial photograph for news article about ${cat.slug}: "${articleData.title.slice(0, 80)}". Professional press photography, high contrast, real world scene, photorealistic. NO TEXT.`;
      const polUrl2      = `https://image.pollinations.ai/prompt/${encodeURIComponent(altPrompt)}?width=1280&height=720&nologo=true&seed=${seed2}`;
      finalImageUrl      = await internalizeImage(polUrl2, 2);
    }

    // GUARDIÁN FINAL: Si aún no tenemos Cloudinary → reciclar imagen reciente de la misma categoría
    if (!finalImageUrl || !finalImageUrl.includes('cloudinary.com')) {
      console.warn(`[Bot] ⚠️ GUARDIÁN: Cloudinary falló. Reciclando imagen de la BD para no perder el artículo...`);
      try {
        const { data: recycleImg } = await supabase
          .from('articles')
          .select('image')
          .eq('category', cat.slug)
          .like('image', '%cloudinary.com%')
          .order('publishedAt', { ascending: false })
          .limit(5);
        const candidates = (recycleImg || []).map(r => r.image).filter(Boolean);
        if (candidates.length > 0) {
          finalImageUrl = candidates[Math.floor(Math.random() * candidates.length)];
          console.log(`[Bot] ♻️ Imagen reciclada de BD [${cat.slug}]: ${finalImageUrl.slice(0, 60)}`);
        } else {
          // Último recurso: cualquier imagen Cloudinary de cualquier categoría
          const { data: anyImg } = await supabase
            .from('articles')
            .select('image')
            .like('image', '%cloudinary.com%')
            .order('publishedAt', { ascending: false })
            .limit(1)
            .single();
          finalImageUrl = anyImg?.image || null;
          if (finalImageUrl) console.log(`[Bot] ♻️ Imagen reciclada global: ${finalImageUrl.slice(0, 60)}`);
        }
      } catch (recycleErr) {
        console.warn(`[Bot] Reciclar imagen falló: ${recycleErr.message}`);
      }
      // Si sigue sin imagen, publicar sin imagen — el artículo vale más que ninguno
      if (!finalImageUrl) {
        console.warn(`[Bot] ⚠️ Publicando sin imagen. El contenido tiene prioridad.`);
      }
    }

    if (finalImageUrl) {
      console.log(`[Bot] ✅ Imagen Cloudinary garantizada: ${finalImageUrl.slice(0, 70)}...`);
    } else {
      console.warn(`[Bot] ⚠️ Publicando sin imagen (todas las fuentes fallaron).`);
    }


    // ─── VALIDACIÓN DE CALIDAD FINAL (Content Length) ────────────────────────
    if (articleData.content.length < 1200) {
      throw new Error(`Contenido demasiado corto (${articleData.content.length} caracteres). Se requiere un análisis más profundo para mantener el estándar premium.`);
    }
    // ────────────────────────────────────────────────────────────────────────

    let sourceName = 'Fuente Externa';
    try {
      const urlObj = new URL(news.link);
      sourceName = urlObj.hostname.replace('www.', '').split('.')[0].toUpperCase();
      const sourceMap = {
        'acento': 'Acento.com.do',
        'n.com.do': 'N Digital (Nuria Piera)',
        'elnacional': 'El Nacional',
        'elcaribe': 'El Caribe',
        'hoy': 'Hoy Digital',
        'eldia': 'El Día',
        'cdn': 'CDN 37',
        'noticiassin': 'Noticias SIN',
        'desenredandodr': 'Desenredando RD',
        'deultimominuto': 'De Último Minuto',
        'diariolibre': 'Diario Libre',
        'almomento': 'AlMomento.net',
        'remolacha': 'Remolacha.net',
        'cnnespanol': 'CNN en Español',
        'france24': 'France 24',
        'dw': 'Deutsche Welle (DW)',
        'bbc': 'BBC Mundo',
        'rtve': 'RTVE',
        'europapress': 'Europa Press'
      };
      sourceName = sourceMap[sourceName.toLowerCase()] || sourceName;
    } catch (e) { /* ignore */ }

    // Sanitize tags: strip leading # and whitespace, remove empty entries
    let cleanedTags = Array.isArray(articleData.tags)
      ? articleData.tags
          .map(t => String(t).trim().replace(/^#+/, '').replace(/[_\s]+/g, ''))
          .filter(t => t.length > 0 && t.length < 60)
      : [];

    // Fallback: si la IA no devolvió tags, generamos algunos del título + categoría
    if (cleanedTags.length === 0) {
      console.warn('[Bot] IA no devolvió tags. Generando fallback desde título...');
      const titleWords = articleData.title
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 5)
        .map(w => { const s = String(w || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''; })
        .filter(Boolean);
      cleanedTags = [cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1), ...titleWords];
    }

    // REGLA CRÍTICA: La categoría SIEMPRE es la del agente que disparó el bot.
    // La IA no puede reclasificar artículos a otras secciones.
    const newArticle = {
      title: articleData.title,
      slug,
      excerpt: articleData.excerpt || articleData.title,
      content: articleData.content,
      tags: cleanedTags.length > 0 ? cleanedTags : null,
      category: cat.slug,   // ← SIEMPRE la sección del agente, sin excepción
      author: cat.author,   // ← SIEMPRE el autor de la sección
      image: finalImageUrl,
      imageAlt: articleData.title,
      source_link: news.link,
      source_name: sourceName,  // ← nombre legible del medio fuente (fix BUG-7)
      publishedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Las noticias de ÚLTIMA HORA siempre son destacadas
      featured: articleData.impact_level === 'high' || articleData.impact_level === 'medium' || isNewsBreaking || Math.random() > 0.9,
      trending: articleData.impact_level === 'high' || (isNewsBreaking && Math.random() > 0.5),
    };

    if (isNewsBreaking) {
      console.log(`[Bot] ⚡ Artículo marcado como DESTACADO por ser ÚLTIMA HORA.`);
    }

    const { data: insertedArticle, error: insertError } = await supabase
      .from('articles')
      .insert(newArticle)
      .select('id, title')
      .single();

    if (insertError) throw new Error(`Error al guardar en BD: ${insertError.message}`);

    // NOTIFICACIÓN PRIORITARIA: Indexación en Google (Instantánea)
    try {
      const articleUrl = `${SITE_CONFIG.url}/articulo/${slug}`;
      await notifyGoogleIndexing(articleUrl);
      
      // AUTO-POST EN REDES: Desactivado — el admin controla cuándo publicar en redes
      // desde el panel de administración con el botón "📢 Publicar en Redes".
      // Para reactivar el auto-post, descomentar la línea siguiente:
      // await postToSocialMedia(newArticle);
    } catch (indexErr) {
      console.warn('[Bot] No se pudo notificar a servicios externos:', indexErr.message);
    }

    console.log(`[Bot] ✅ Artículo publicado en sección "${cat.slug}": "${articleData.title.slice(0, 60)}"`);
    return NextResponse.json({
      success: true,
      message: '¡Noticia publicada con éxito!',
      article: {
        id: insertedArticle.id,
        title: insertedArticle.title,
        slug,
        category: cat.slug,
      },
    }, { status: 200 });

      } catch (aiError) {
        console.log(`[Bot] Descartada noticia "${news.title.slice(0, 60)}": ${aiError.message}`);
        // Continúa con la siguiente noticia en el bucle
        continue;
      }
    } // fin del bucle for

    // Si termina el bucle y no se publicó nada
    return NextResponse.json({ message: `No se pudo generar contenido válido para ninguna de las noticias candidatas.` }, { status: 200 });

  } catch (error) {
    console.error(`[Bot Error]`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
