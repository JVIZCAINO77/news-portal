import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { internalizeImage } from '@/lib/botUtils';
import { notifyGoogleIndexing } from '@/lib/indexing';
import { postToSocialMedia } from '@/lib/social';
import { SITE_CONFIG } from '@/lib/data';

// Token secreto para evitar ataques externos, manejado por Vercel
const CRON_SECRET = process.env.CRON_SECRET;

// ─── LÍMITES DIARIOS ─────────────────────────────────────────────────────────
// Google AdSense requiere contenido ORIGINAL, de calidad y publicado con consistencia.
// Recomendación editorial: 2-3 artículos por categoría, máximo 12-15 por día.
// Más de 15 artículos/día en un sitio nuevo puede interpretarse como contenido spam.
const DAILY_LIMIT_GLOBAL   = 12; // TOTAL diario — óptimo para AdSense (calidad > cantidad)
const DAILY_LIMIT_NORMAL   = 2;  // Artículos reescritos por categoría/día
const DAILY_LIMIT_BREAKING = 4;  // Máximo para ÚLTIMA HORA (siempre reescrita por IA)

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
function extractKeywords(title) {
  if (!title) return new Set();
  const normalized = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
  return new Set(
    normalized.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w))
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

// Umbral mínimo de solapamiento para considerar dos noticias "el mismo evento"
const SEMANTIC_THRESHOLD = 0.35; // 35% de palabras en común → duplicado semántico

const CATEGORIES = {
  noticias: {
    slug: 'noticias', author: 'Redacción Central', style: 'periodístico objetivo y formal',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://acento.com.do/feed/?s=nacional',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/?s=nacional',
      'https://elnacional.com.do/feed/?s=',
      'https://hoy.com.do/feed/?s=noticias',
    ],
  },
  entretenimiento: {
    slug: 'entretenimiento', author: 'Sección Espectáculos', style: 'dinámico y ameno',
    feeds: [
      'https://www.diariolibre.com/rss/revista.xml',
      'https://acento.com.do/feed/?s=farandula',
      'https://remolacha.net/feed/',
      'https://hoy.com.do/feed/?s=farándula',
      'https://elnacional.com.do/feed/?s=espectaculos',
    ],
  },
  deportes: {
    slug: 'deportes', author: 'Mesa Deportiva', style: 'analítico y pasional',
    feeds: [
      'https://www.diariolibre.com/rss/deportes.xml',
      'https://acento.com.do/feed/?s=deportes',
      'https://elnacional.com.do/feed/?s=deportes',
      'https://hoy.com.do/feed/?s=deportes',
      'https://cdn.com.do/feed/?s=deportes',
    ],
  },
  tecnologia: {
    slug: 'tecnologia', author: 'Redacción Tecnológica', style: 'informativo y vanguardista',
    feeds: [
      'https://acento.com.do/feed/?s=tecnologia',
      'https://cnnespanol.cnn.com/feed/',
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
      'https://www.france24.com/es/rss',
    ],
  },
  economia: {
    slug: 'economia', author: 'Redacción Económica', style: 'serio y financiero',
    feeds: [
      'https://www.diariolibre.com/rss/economia.xml',
      'https://acento.com.do/feed/?s=economia',
      'https://elcaribe.com.do/feed/?s=economia',
      'https://hoy.com.do/feed/?s=economia',
      'https://cdn.com.do/feed/?s=economia',
    ],
  },
  salud: {
    slug: 'salud', author: 'Sección de Salud y Bienestar', style: 'profesional, informativo y confiable',
    feeds: [
      'https://acento.com.do/feed/?s=salud',
      'https://cnnespanol.cnn.com/feed/',
      'https://www.bbc.com/mundo/index.xml',
      'https://hoy.com.do/feed/?s=salud',
      'https://rss.dw.com/xml/rss-es-all',
    ],
  },
  cultura: {
    slug: 'cultura', author: 'Sección Cultural', style: 'elegante y descriptivo',
    feeds: [
      'https://www.diariolibre.com/rss/revista.xml',
      'https://acento.com.do/feed/?s=cultura',
      'https://hoy.com.do/feed/?s=cultura',
      'https://elnacional.com.do/feed/?s=cultura',
      'https://www.rtve.es/api/noticias.rss',
    ],
  },
  opinion: {
    slug: 'opinion', author: 'Dirección Editorial', style: 'reflexivo, analítico y profundo',
    feeds: [
      'https://www.diariolibre.com/rss/opinion.xml',
      'https://acento.com.do/feed/?s=opinion',
      'https://elnacional.com.do/feed/?s=opinion',
      'https://hoy.com.do/feed/?s=opinion',
    ],
  },
  sucesos: {
    slug: 'sucesos', author: 'Redacción de Sucesos', style: 'informativo, serio y cauteloso',
    feeds: [
      'https://acento.com.do/feed/?s=sucesos',
      'https://almomento.net/feed/',
      'https://cdn.com.do/feed/?s=sucesos',
      'https://deultimominuto.net/feed/?s=',
      'https://noticiassin.com/feed/?s=policia',
    ],
  },
  tendencias: {
    slug: 'tendencias', author: 'Mesa de Tendencias', style: 'ágil y moderno',
    feeds: [
      'https://remolacha.net/feed/',
      'https://cnnespanol.cnn.com/feed/',
      'https://www.bbc.com/mundo/index.xml',
      'https://acento.com.do/feed/?s=viral',
      'https://elnacional.com.do/feed/?s=tendencias',
    ],
  },
  internacional: {
    slug: 'internacional', author: 'Redacción Internacional', style: 'global y analítico',
    feeds: [
      'https://cnnespanol.cnn.com/feed/',
      'https://www.france24.com/es/rss',
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
      'https://www.rtve.es/api/noticias.rss',
    ],
  },
  politica: {
    slug: 'politica', author: 'Mesa Política', style: 'neutral y objetivo',
    feeds: [
      'https://acento.com.do/feed/?s=politica',
      'https://elcaribe.com.do/feed/?s=politica',
      'https://hoy.com.do/feed/?s=política',
      'https://cdn.com.do/feed/?s=politica',
      'https://noticiassin.com/feed/?s=politica',
    ],
  },
};

// ─── VALIDADOR TEMÁTICO — BLOCKLIST + ALLOWLIST ───────────────────────────────
// BLOCKLIST: palabras que NUNCA deben aparecer en esa sección.
// ALLOWLIST: al menos UNA de estas palabras DEBE aparecer para que el ítem sea válido.

const TOPIC_BLOCKLIST = {
  deportes:       ['homicidio','asesinado','asesinato','detenido','arrestado',
                   'inflacion','pib','banco central','ministro de'],
  economia:       ['beisbol','jonron','mlb','nba','partido de futbol',
                   'actor','actriz','cantante','concierto','farandula','gol','pitcher'],
  politica:       ['beisbol','jonron','mlb','nba','actor','actriz','cantante',
                   'concierto','farandula','homicidio','gol','pitcher','deporte'],
  salud:          ['beisbol','jonron','mlb','presidente abinader','asesinado','homicidio',
                   'partido politico','gol','pitcher','deporte'],
  entretenimiento:['presidente abinader','ministro de','pib','inflacion',
                   'banco central','homicidio','asesinado','tribunal','gol','beisbol'],
  cultura:        ['beisbol','jonron','mlb','nba','pib','inflacion','banco central',
                   'homicidio','asesinado','detenido'],
  tecnologia:     ['homicidio','asesinado','asesinato','detenido por','arrestado por',
                   'presidente abinader','ministro de','senado dominicano','elecciones',
                   'votos','partido politico','diputado','senador','beisbol','futbol','gol'],
  sucesos:        ['actor','actriz','cantante','concierto','beisbol','jonron','mlb','nba',
                   'futbol','pib','inflacion'],
  tendencias:     ['pib','inflacion','banco central','reforma constitucional',
                   'proyecto de ley','decreto presidencial','senado dominicano',
                   'homicidio','asesinato','beisbol','partido politico'],
  internacional:  ['presidente abinader','senado dominicano','camara de diputados',
                   'ayuntamiento de','alcalde de rd','abinader'],
  opinion:        [],
  noticias:       [],
};

const TOPIC_ALLOWLIST = {
  deportes:       ['deporte','beisbol','futbol','baloncesto','nba','mlb','atleta','jugador',
                   'equipo','partido','torneo','campeonato','liga','gol','jonron','pitcher',
                   'pelotero','cancha','estadio','boxeo','tenis','ciclismo','medalla'],
  economia:       ['economia','economico','financiero','pib','inflacion','banco','dolar',
                   'mercado','inversion','empresa','comercio','impuesto','presupuesto',
                   'exportacion','importacion','precio','costo','deficit','reservas'],
  politica:       ['politica','politico','gobierno','presidente','ministro','diputado',
                   'senador','partido','elecciones','congreso','legislacion','decreto',
                   'reforma','municipio','alcalde','gabinete','poder ejecutivo','legislativo'],
  salud:          ['salud','medico','medica','hospital','enfermedad','vacuna','tratamiento',
                   'paciente','clinica','medicina','virus','pandemia','cancer','diabetes',
                   'bienestar','prevencion','nutricion','farmaco','epidemia','sanitario'],
  entretenimiento:['espectaculo','farandula','actor','actriz','cantante','pelicula','serie',
                   'concierto','artista','musica','teatro','show','celebridad','estreno',
                   'nominacion','premio','reggaeton','bachata','merengue','influencer'],
  cultura:        ['cultura','arte','museo','exposicion','patrimonio','literatura','libro',
                   'autor','escritor','festival','teatro','danza','folclore','tradicion',
                   'gastronomia','arquitectura','identidad','artesania'],
  tecnologia:     ['tecnologia','inteligencia artificial','ia','robot','app','software',
                   'hardware','digital','internet','ciberseguridad','startup','innovacion',
                   'samsung','apple','google','meta','openai','computadora','smartphone'],
  sucesos:        ['detenido','arrestado','capturado','homicidio','asesinado','robo',
                   'accidente','incendio','crimen','policia','autoridades','investigacion',
                   'victima','sospechoso','fugitivo','delito','herido','muerto','matan'],
  tendencias:     ['viral','tendencia','redes sociales','tiktok','instagram','twitter',
                   'youtube','influencer','meme','trending','popular','hashtag'],
  internacional:  ['internacional','mundo','eeuu','estados unidos','europa','china','rusia',
                   'latinoamerica','onu','biden','trump','guerra','conflicto','diplomacia',
                   'cumbre','tratado','extranjero','global','migración'],
  opinion:        ['opinion','editorial','columna','analisis','punto de vista','perspectiva'],
  noticias:       [], // sección general, sin restricción de allowlist
};

/**
 * Verifica si el ítem del RSS es temáticamente apto para la sección.
 * Requiere: (1) ninguna palabra del BLOCKLIST y (2) al menos una del ALLOWLIST.
 */
function isOnTopicForCategory(item, categorySlug) {
  const blocklist = TOPIC_BLOCKLIST[categorySlug] || [];
  const allowlist = TOPIC_ALLOWLIST[categorySlug] || [];

  const text = `${item.title || ''} ${item.contentSnippet || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Verificar BLOCKLIST: si aparece alguna palabra prohibida → descartar
  const blocked = blocklist.some(w =>
    text.includes(w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
  if (blocked) return false;

  // Verificar ALLOWLIST: debe existir al menos UNA palabra temática (si hay lista)
  if (allowlist.length === 0) return true; // sin restricción (noticias / opinion)
  return allowlist.some(w =>
    text.includes(w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  );
}

export async function GET(request) {
  const isManualTrigger = request.headers.get('X-Manual-Trigger') === 'true';

  if (!isManualTrigger && CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado. Se requiere token CRON.' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const categoryKey = searchParams.get('category') || 'noticias';

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

    // Check por Categoría
    const { count: countToday } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('category', cat.slug)
      .gte('publishedAt', startOfTodayDR)
      .lte('publishedAt', endOfTodayDR);

    if ((countToday ?? 0) >= DAILY_LIMIT_BREAKING) {
      return NextResponse.json({ message: `Límite de categoría ${cat.slug} alcanzado (${countToday}).` }, { status: 200 });
    }

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
        console.log(`[Bot] 🔁 Duplicado SEMÁNTICO (${overlap}% overlap): "${item.title.slice(0, 60)}" ya cubierto hoy.`);
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

    const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    // gemini-2.0-flash-lite: cuota SEPARADA de gemini-2.0-flash, más ligero y rápido
    // gemini-2.0-flash: modelo principal con 1500 req/día en free tier
    // NO usar gemini-1.5-flash — no está disponible en v1beta
    const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];

    const prompt = `Eres el editor de la sección "${cat.slug.toUpperCase()}" de "Imperio Público", un medio digital de élite reconocido por su profundidad periodística y rigor analítico.

--- DATOS DE LA NOTICIA ---
Fecha: ${todayDR}
SECCIÓN ASIGNADA (FIJA, NO CAMBIAR): ${cat.slug.toUpperCase()}
Titular de fuente: ${news.title}
Resumen de fuente: ${news.contentSnippet || 'Sin resumen disponible'}
--------------------------

REGLAS EDITORIALES CRÍTICAS (MANDATORIAS):
1. SECCIÓN: Tu artículo se publicará EXCLUSIVAMENTE en la sección "${cat.slug.toUpperCase()}". No debes cambiarla. Redacta el contenido enfocado en ese ángulo editorial.
2. IDIOMA: Español neutro y profesional.
3. VALOR AGREGADO (E-E-A-T): 
   - El artículo DEBE incluir un análisis del impacto de la noticia para la sociedad o el sector relacionado.
   - Proporciona contexto histórico o antecedentes si son relevantes para entender el hecho.
4. ESTRUCTURA SEO PREMIUM: 
   - Primer párrafo: Debe enganchar al lector con los datos clave (qué, quién, dónde, cuándo) integrando palabras clave de forma natural.
   - Usa al menos 3 subtítulos (##) analíticos y atractivos.
   - Usa **negritas** para resaltar datos estadísticos, nombres propios y declaraciones clave.
5. TÍTULO (campo "title"): 
   - Debe ser original, potente y optimizado para SEO (50-70 caracteres). 
   - Evita el sensacionalismo barato; busca la autoridad informativa.
6. CONTENIDO (campo "content"):
   - MÍNIMO 550 palabras. Si el resumen es corto, expande con análisis, implicaciones futuras y contexto general del tema.
   - Estilo: ${cat.style}.
   - PROHIBIDO: Frases genéricas de IA como "En el dinámico mundo de hoy", "Es importante destacar", etc.
7. EXCERPT (campo "excerpt"):
   - Meta-descripción perfecta de 155 caracteres que incite al clic por su valor informativo.

PASO 1 — EVALUACIÓN:
- Si la noticia es vieja (>48h), trivial o sin relevancia pública → responde exactamente: IRRELEVANTE.

PASO 2 — FORMATO DE RESPUESTA:
Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin texto adicional):
{ "title": "<titular_autoridad>", "excerpt": "<gancho_informativo>", "content": "<contenido_analitico_extenso_markdown>", "tags": ["Tag1", "Tag2", "Tag3"], "impact_level": "high|medium|low" }`;


    // ─── ROTACIÓN DE CLAVES Y MODELOS ─────────────────────────────────────────
    // Prueba CADA clave con CADA modelo antes de rendirse.
    // Esto garantiza que mientras cualquier clave tenga cuota disponible, el bot funciona.
    let rawText = '';
    let aiSuccess = false;
    for (const key of keys) {
      if (aiSuccess) break;
      for (const model of models) {
        try {
          console.log(`[Bot] Probando clave ...${key.slice(-6)} con modelo ${model}`);
          const ai = new GoogleGenAI({ apiKey: key });
          const aiResponse = await ai.models.generateContent({ model, contents: prompt });
          rawText = aiResponse.text || '';
          if (rawText) {
            console.log(`[Bot] ✅ Éxito con clave ...${key.slice(-6)} / ${model}`);
            aiSuccess = true;
            break;
          }
        } catch (keyErr) {
          const isQuota = keyErr.message?.includes('429') || keyErr.message?.includes('Quota') || keyErr.message?.includes('RESOURCE_EXHAUSTED');
          const isInvalid = keyErr.message?.includes('API key not valid') || keyErr.status === 400;
          if (isQuota) {
            console.log(`[Bot] ⚠️ Cuota agotada: clave ...${key.slice(-6)} / ${model}`);
          } else if (isInvalid) {
            console.log(`[Bot] ❌ Clave inválida: ...${key.slice(-6)} — se omite.`);
            break; // Pasar a la siguiente clave, no tiene sentido probar otro modelo con esta
          } else {
            console.log(`[Bot] ❌ Error inesperado (${model}): ${keyErr.message?.slice(0, 80)}`);
          }
        }
      }
    }

    // Si todos los modelos y claves de Gemini fallaron → intentar Pollinations como último recurso
    // IMPORTANTE: si Pollinations también falla, el artículo NO se publica. Nunca se publica sin reescribir.
    if (!aiSuccess) {
      console.log('[Bot] ⚠️ Gemini sin cuota. Intentando Pollinations (timeout 25s)...');
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s — dentro del límite de Vercel
        const shortPrompt = `Eres periodista de Imperio Público. Noticia sección ${cat.slug.toUpperCase()}: "${news.title}". Resumen disponible: "${(news.contentSnippet||'').slice(0,250)}". Escribe artículo en español mínimo 500 palabras con 3 subtítulos ##. Responde SOLO JSON: {"title":"titular 50-70 chars","excerpt":"resumen max 150 chars","content":"artículo markdown","tags":["T1","T2","T3"],"impact_level":"high"}`;
        const polRes = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: 'Eres un periodista profesional. Responde ÚNICAMENTE con JSON válido, sin texto extra ni bloques de código.' },
              { role: 'user', content: shortPrompt }
            ],
            model: 'openai',
            jsonMode: true,
            seed: Math.floor(Math.random() * 99999),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!polRes.ok) throw new Error(`Pollinations HTTP ${polRes.status}`);
        rawText = await polRes.text();
        if (rawText) console.log('[Bot] ✅ Pollinations respondió correctamente.');
      } catch (pollinationsError) {
        // ── CANDADO DE SEGURIDAD ─────────────────────────────────────────────────
        // Ninguna IA está disponible. El artículo se descarta. NUNCA se publica
        // contenido sin reescribir para cumplir con AdSense y estándares editoriales.
        console.log(`[Bot] 🔒 CANDADO ACTIVADO: ninguna IA disponible. Artículo descartado (no publicar sin reescritura).`);
        throw new Error('Sin IA disponible: todas las cuotas de Gemini agotadas y Pollinations sin respuesta. Artículo descartado por política editorial.');
      }
    }

    const cleanedText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    console.log(`[Bot DEBUG] AI Raw Text:`, rawText.substring(0, 200));

    // ── Guardia IRRELEVANTE ─────────────────────────────────────
    if (/irrelevante/i.test(cleanedText)) {
      throw new Error(`La IA dictaminó IRRELEVANTE para: "${news.title.slice(0, 80)}"`);
    }

    let articleData;
    try {
      articleData = JSON.parse(cleanedText);
    } catch (parseError) {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error(`Respuesta de IA no válida: no JSON format`);
      }
      try {
        articleData = JSON.parse(jsonMatch[0]);
      } catch (innerError) {
        throw new Error(`Respuesta de IA no válida: JSON malformed`);
      }
    }

    if (!articleData.title || !articleData.content) {
      throw new Error('La IA no devolvió los campos requeridos.');
    }



    // ─── GUARDIA ANTI-PLACEHOLDER ───────────────────────────────────────────
    // Detecta si la IA devolvió texto de plantilla en vez de contenido real
    const PLACEHOLDER_SIGNALS = [
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
      '[Nombre del', '[Tu nombre', 'Inserte aquí', 'Escribe el artículo',
      'Como editor de', 'Aquí tienes el artículo', 'Claro, aquí tienes',
    ];
    
    const normalizeForCheck = (str) => 
      String(str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const combinedAiText = normalizeForCheck(
      `${articleData.title} ${articleData.excerpt} ${articleData.content} ${(articleData.tags || []).join(' ')}`
    );

    const isPlaceholder = PLACEHOLDER_SIGNALS.some(sig => 
      combinedAiText.includes(normalizeForCheck(sig))
    );

    if (isPlaceholder) {
      throw new Error(`La IA devolvió texto de plantilla en vez de contenido real. Noticia omitida: "${news.title.slice(0, 80)}".`);
    }
    // ────────────────────────────────────────────────────────────────────────
    // ────────────────────────────────────────────────────────────────────────

    // LIMPIEZA ESTRICTA: Reemplazar secuencias literales de \n por saltos de línea reales
    const sanitizeAiText = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/\\+n/g, '\n') // Detecta \n, \\n, \\\n etc y los vuelve saltos reales
        .replace(/\\"/g, '"')  
        .replace(/\n\n+/g, '\n\n') // Colapsa múltiples saltos en máximo 2
        .trim();
    };

    const sanitizeContent = (str) => {
      if (typeof str !== 'string') return str;
      return sanitizeAiText(str)
        // Elimina bloque "Etiquetas SEO:" al final del contenido (variantes comunes)
        // NOTA: usamos ancla de fin de string (no 'g') para no borrar ocurrencias internas
        .replace(/\n?[\s\*]*etiquetas\s*(seo)?\s*:.*$/is, '')
        .replace(/\n?[\s\*]*palabras\s*clave\s*:.*$/is, '')
        .replace(/\n?[\s\*]*keywords?\s*:.*$/is, '')
        .trim();
    };

    articleData.title = sanitizeAiText(articleData.title)
      .replace(/[\r\n\t]+/g, ' ') // Elimina saltos de línea y tabs reales
      .replace(/\s+/g, ' ')       // Colapsa espacios múltiples
      .replace(/[""]/g, '"')     // Normaliza comillas
      .trim();

    // === ESCUDO DE SEGURIDAD: VALIDACIÓN DE TÍTULO ===
    if (!articleData.title || articleData.title.length < 15) {
      throw new Error(`Título generado inválido o demasiado corto: "${articleData.title}"`);
    }

    // === ESCUDO DE SEGURIDAD: DETECCIÓN DE HALLUCINACIÓN (Cruce de keywords) ===
    const sourceKws = extractKeywords(news.title);
    const aiKws = extractKeywords(articleData.title);
    const overlap = semanticOverlap(sourceKws, aiKws);
    // Si no hay SOLAPAMIENTO semántico entre el titular original y el generado (0% overlap)
    // es muy probable que la IA esté alucinando o mezclando noticias.
    if (overlap === 0 && sourceKws.size > 0) {
      throw new Error(`Hallucinación detectada: El titular generado no tiene relación semántica con la fuente.`);
    }

    articleData.excerpt = sanitizeAiText(articleData.excerpt);
    articleData.content = sanitizeContent(articleData.content);

    // ── GUARDIA ANTI-TRUNCADO (Incomplete sentences) ──────────
    // Si el contenido termina en algo que no es puntuación final, es probable que esté truncado
    if (!/[.!?"]\s*$/s.test(articleData.content)) {
      throw new Error(`El contenido parece estar truncado o incompleto (no termina en punto).`);
    }

    // ── CANDADO DE LONGITUD MÍNIMA ─────────────────────────────
    // Si la IA devuelve contenido muy corto, es señal de un fallo o de que copió la fuente.
    // NUNCA publicar artículos que no cumplan el estándar AdSense de contenido sustancial.
    if (articleData.content.length < MIN_CONTENT_LENGTH) {
      throw new Error(`[CANDADO] Contenido demasiado corto (${articleData.content.length} chars). Mínimo requerido: ${MIN_CONTENT_LENGTH}. Artículo descartado por política editorial.`);
    }

    // ── CANDADO DE ORIGINALIDAD: el contenido NO puede ser casi igual al snippet del RSS ─
    // Si el contenido es ≤ 3× la longitud del snippet, probablemente no fue reescrito.
    const sourceSnippetLen = (news.contentSnippet || '').length;
    if (sourceSnippetLen > 100 && articleData.content.length < sourceSnippetLen * 3) {
      throw new Error(`[CANDADO] Contenido no reescrito: el artículo es muy similar en longitud al snippet original. Artículo descartado.`);
    }

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
        const redirectRes = await fetch(news.link, { 
          redirect: 'follow', 
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
          timeout: 8000
        });
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

    // Intentar internalizar la imagen real a Cloudinary
    if (finalImageUrl) {
      console.log(`[Bot] Internalizando imagen: ${finalImageUrl.slice(0, 60)}...`);
      finalImageUrl = await internalizeImage(finalImageUrl);
    }

    // Si no hay imagen (no se encontró, el dominio bloquea, o el upload falló) → imagen de IA
    if (!finalImageUrl || (!finalImageUrl.includes('cloudinary.com') && !finalImageUrl.includes('unsplash.com'))) {
      if (finalImageUrl) {
        console.warn(`[Bot] Imagen externa no internalizada (${finalImageUrl.slice(0, 40)}). Forzando imagen de IA por seguridad.`);
      }
      console.log(`[Bot] Generando imagen por IA para: ${articleData.title}`);
      const topicTags = Array.isArray(articleData.tags) ? articleData.tags.join(', ') : '';
      const visualPrompt = `high-end editorial news photography for an article titled "${articleData.title}". Subject: ${topicTags}. Professional journalistic style, cinematic lighting, 8k resolution, realistic, wide shot, 16:9 aspect ratio. NO TEXT, NO LETTERS, NO WORDS, NO SIGNS, NO LOGOS.`;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=1280&height=720&nologo=true&seed=${Date.now()}`;
      
      // Intentar internalizar la de IA también para máxima estabilidad
      finalImageUrl = await internalizeImage(pollinationsUrl) || pollinationsUrl;
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
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
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
      imageAlt: `Imagen para: ${articleData.title}`,
      source_link: news.link,
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
      
      // AUTO-POST: Redes Sociales
      await postToSocialMedia(newArticle);
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
