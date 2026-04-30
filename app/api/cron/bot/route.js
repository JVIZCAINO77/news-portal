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

// ─── LÍMITES DIARIOS ───────────────────────────────────────────────────────
const DAILY_LIMIT_GLOBAL   = 15; // Máximo TOTAL de artículos por día (Protección AdSense)
const DAILY_LIMIT_NORMAL   = 2;  // Artículos normales por categoría/día
const DAILY_LIMIT_BREAKING = 5;  // Máximo para noticias de ÚLTIMA HORA por categoría

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
  noticias:       { query: `nacionales`,        slug: 'noticias',       author: 'Redacción Central',  style: 'periodístico objetivo y formal' },
  entretenimiento:{ query: `farandula espectaculos`, slug: 'entretenimiento', author: 'Sección Espectáculos', style: 'dinámico y ameno' },
  deportes:       { query: `deportes beisbol`,  slug: 'deportes',        author: 'Mesa Deportiva',  style: 'analítico y pasional' },
  tecnologia:     { query: `tecnologia`,        slug: 'tecnologia',      author: 'Redacción Tecnológica', style: 'informativo y vanguardista' },
  economia:       { query: `economia`,          slug: 'economia',        author: 'Redacción Económica', style: 'serio y financiero' },
  salud:          { query: `salud medicina`,    slug: 'salud',           author: 'Sección de Salud y Bienestar', style: 'profesional, informativo y confiable' },
  cultura:        { query: `cultura arte`,      slug: 'cultura',         author: 'Sección Cultural', style: 'elegante y descriptivo' },
  opinion:        { query: `opinion editorial`, slug: 'opinion',         author: 'Dirección Editorial', style: 'reflexivo, analítico y profundo' },
  sucesos:        { query: `sucesos policia`,   slug: 'sucesos',         author: 'Redacción de Sucesos', style: 'informativo, serio y cauteloso' },
  tendencias:     { query: `viral redes`,       slug: 'tendencias',      author: 'Mesa de Tendencias', style: 'ágil y moderno' },
  internacional:  { query: `internacional mundo`, slug: 'internacional', author: 'Redacción Internacional', style: 'global y analítico' },
  politica:       { query: `politica`,          slug: 'politica',        author: 'Mesa Política', style: 'neutral y objetivo' },
};

// ─── VALIDADOR TEMÁTICO ───────────────────────────────────────────────────────
// Palabras que NUNCA deben aparecer en el título de una noticia de esa sección.
// Si aparecen → el ítem del feed NO es apto para esa sección y se descarta.
// Esto previene que el agente de "tecnologia" procese noticias de "sucesos", etc.
const TOPIC_BLOCKLIST = {
  // Un artículo de DEPORTES no puede hablar de crímenes o economía doméstica
  deportes: ['homicidio','asesinado','asesinato','detenido','arrestado',
             'inflacion','pib','banco central','ministro de','presidente abinader'],

  // Un artículo de ECONOMÍA no puede hablar de deportes o farándula
  economia: ['beisbol','jonron','mlb','nba','partido de futbol',
             'actor','actriz','cantante','concierto','farandula'],

  // Un artículo de POLÍTICA no puede hablar de farándula o deportes
  politica: ['beisbol','jonron','mlb','nba','actor','actriz','cantante',
             'concierto','farandula','asesinado a tiros','homicidio'],

  // Un artículo de SALUD no puede hablar de deportes, política o crímenes
  salud: ['beisbol','jonron','mlb','presidente abinader','ministro de',
          'asesinado','homicidio','partido politico'],

  // Un artículo de ENTRETENIMIENTO no puede hablar de política o economía
  entretenimiento: ['presidente abinader','ministro de','pib','inflacion',
                    'banco central','homicidio','asesinado','tribunal'],

  // Un artículo de CULTURA no puede hablar de deportes o economía macro
  cultura: ['beisbol','jonron','mlb','nba','pib','inflacion','banco central'],

  // Un artículo de TECNOLOGÍA no puede hablar de crímenes ni política local
  tecnologia: ['homicidio','asesinado','asesinato','detenido por','arrestado por',
               'presidente abinader','ministro de','senado dominicano','elecciones',
               'votos','partido politico','diputado','senador','balonmano','beisbol','futbol'],

  // Un artículo de SUCESOS no puede hablar de farándula o deportes
  sucesos: ['actor','actriz','cantante','concierto','beisbol','jonron','mlb','nba','futbol'],

  // Un artículo de TENDENCIAS no puede hablar de macroeconomía ni política formal
  tendencias: ['pib','inflacion','banco central','reforma constitucional',
               'proyecto de ley','decreto presidencial','senado dominicano','homicidio','asesinato'],

  // Un artículo de INTERNACIONAL no puede hablar de política local dominicana
  internacional: ['presidente abinader','senado dominicano','camara de diputados',
                  'ayuntamiento de','alcalde de rd','abinader','dajabón','mirador sur','santo domingo'],

  // Un artículo de OPINIÓN no necesita filtro estricto
  opinion: [],

  // NOTICIAS es la sección general — sin filtros
  noticias: [],
};

/**
 * Verifica si el ítem del RSS es temáticamente apto para la sección.
 * Devuelve true si el ítem puede procesarse para esa sección.
 */
function isOnTopicForCategory(item, categorySlug) {
  const blocklist = TOPIC_BLOCKLIST[categorySlug] || [];
  if (blocklist.length === 0) return true; // sin filtro

  const text = `${item.title || ''} ${item.contentSnippet || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // Si el texto contiene alguna palabra bloqueada → descartar
  return !blocklist.some(blocked => {
    const norm = blocked.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return text.includes(norm);
  });
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

  try {
    // Fecha de hoy en zona horaria de República Dominicana (UTC-4)
    const todayDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());

    const parser = new Parser({
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
      }
    });
    // --- MEJORA: Consultar múltiples fuentes para encontrar la mejor tendencia ---
    // Determinar el feed de Diario Libre según la categoría
    let dlFeed = 'portada';
    if (cat.slug === 'economia') dlFeed = 'economia';
    else if (cat.slug === 'deportes') dlFeed = 'deportes';
    else if (cat.slug === 'opinion') dlFeed = 'opinion';
    else if (['entretenimiento', 'cultura', 'tendencias'].includes(cat.slug)) dlFeed = 'revista';
    else if (['noticias', 'politica', 'sucesos', 'internacional'].includes(cat.slug)) dlFeed = 'actualidad';

    const allSources = [
      'https://acento.com.do/feed/?s=',
      'https://n.com.do/feed/?s=',
      'https://elnacional.com.do/feed/?s=',
      'https://elcaribe.com.do/feed/?s=',
      'https://hoy.com.do/feed/?s=',
      'https://eldia.com.do/feed/?s=',
      'https://cdn.com.do/feed/?s=',
      'https://noticiassin.com/feed/?s=',
      'https://desenredandodr.com/feed/?s=',
      'https://deultimominuto.net/feed/?s=',
      `https://www.diariolibre.com/rss/${dlFeed}.xml`,
      'https://almomento.net/feed/',
      'https://remolacha.net/feed/',
      'https://cnnespanol.cnn.com/feed/',
      'https://www.france24.com/es/rss',
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
      'https://www.rtve.es/api/noticias.rss',
      'https://www.europapress.es/rss/rss.aspx?ch=00066'
    ];

    // Ahora usamos TODOS los medios disponibles para mayor diversidad
    const selectedSources = allSources;
    
    let pooledItems = [];
    for (const source of selectedSources) {
      try {
        const feedUrl = source.includes('?s=') 
          ? `${source}${encodeURIComponent(cat.query)}` 
          : source;
        const feed = await parser.parseURL(feedUrl);
        if (feed.items) pooledItems = [...pooledItems, ...feed.items];
      } catch (e) {
        console.error(`[Bot] Error en fuente ${source}:`, e.message);
      }
    }

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

    // === CAPA 2: Límite diario con excepción para ÚLTIMA HORA ===
    const startOfTodayDR = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
    const endOfTodayDR   = new Date(`${todayDR}T23:59:59-04:00`).toISOString();

    // 2a. Check GLOBAL (Seguridad AdSense)
    const { data: globalArticles } = await supabase
      .from('articles')
      .select('id')
      .gte('publishedAt', startOfTodayDR)
      .lte('publishedAt', endOfTodayDR);
    
    const totalToday = globalArticles?.length ?? 0;
    if (totalToday >= DAILY_LIMIT_GLOBAL) {
      return NextResponse.json({
        message: `Límite GLOBAL diario alcanzado (${totalToday}/${DAILY_LIMIT_GLOBAL}). Protegiendo AdSense.`
      }, { status: 200 });
    }

    // 2b. Check por Categoría
    const { data: categoryArticles } = await supabase
      .from('articles')
      .select('id')
      .eq('category', cat.slug)
      .gte('publishedAt', startOfTodayDR)
      .lte('publishedAt', endOfTodayDR);

    const countToday = categoryArticles?.length ?? 0;

    // Detectar si alguna noticia de hoy es de ÚLTIMA HORA para aumentar el cupo
    const hasBreakingItem = todaysItems.some(item => isBreakingNews(item.title));
    const effectiveLimit  = hasBreakingItem ? DAILY_LIMIT_BREAKING : DAILY_LIMIT_NORMAL;

    if (countToday >= effectiveLimit) {
      return NextResponse.json({
        message: `Límite de categoría alcanzado: ya hay ${countToday} artículos de ${categoryKey} publicados hoy.`
      }, { status: 200 });
    }

    if (hasBreakingItem) {
      console.log(`[Bot] ⚡ ÚLTIMA HORA detectada en ${categoryKey}. Límite ampliado.`);
    }

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

    // === CAPA 4: Selección final — priorizar ÚLTIMA HORA, luego el resto ===
    // Separar ítems de ÚLTIMA HORA del resto para procesarlos primero
    const breakingItems = todaysItems.filter(i => isBreakingNews(i.title)).sort(() => 0.5 - Math.random());
    const normalItems   = todaysItems.filter(i => !isBreakingNews(i.title)).sort(() => 0.5 - Math.random());
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
    const selectedKey = keys[Math.floor(Math.random() * keys.length)] || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: selectedKey });

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


    let rawText = '';
    try {
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      rawText = aiResponse.text || '';
    } catch (fallbackError) {
      if (fallbackError.message.includes('Quota') || fallbackError.message.includes('429')) {
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: prompt,
          });
          rawText = fallbackResponse.text || '';
        } catch (superFallbackError) {
           const textUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`;
           const polRes = await fetch(textUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
           rawText = await polRes.text();
        }
      } else {
        throw fallbackError;
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

    articleData.title = sanitizeAiText(articleData.title);
    articleData.excerpt = sanitizeAiText(articleData.excerpt);
    articleData.content = sanitizeContent(articleData.content);


    let finalImageUrl = null;
    try {
      const redirectRes = await fetch(news.link, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await redirectRes.text();
      
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      
      if (ogImageMatch && ogImageMatch[1]) {
        finalImageUrl = ogImageMatch[1];
      } else {
        const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
        if (twitterImageMatch && twitterImageMatch[1]) {
          finalImageUrl = twitterImageMatch[1];
        } else {
          const anyImageMatch = html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i);
          if (anyImageMatch && anyImageMatch[1]) {
            finalImageUrl = anyImageMatch[1];
          }
        }
      }

      if (finalImageUrl) {
        if (finalImageUrl.startsWith('//')) {
          finalImageUrl = `https:${finalImageUrl}`;
        } else if (finalImageUrl.startsWith('/')) {
          const origin = new URL(redirectRes.url).origin;
          finalImageUrl = `${origin}${finalImageUrl}`;
        }
        if (finalImageUrl.length < 15 || finalImageUrl.toLowerCase().includes('logo') || finalImageUrl.toLowerCase().includes('icon')) {
          finalImageUrl = null;
        }
      }
    } catch (err) {
      console.warn('[Scraper Warning] No se pudo extraer imagen real:', err.message);
    }

    // MEJORA: Generación de Imagen por IA como Fallback si no se encontró imagen real
    if (!finalImageUrl) {
      console.log(`[Bot] Generando imagen por IA como fallback para: ${articleData.title}`);
      const visualPrompt = `professional editorial news photography, ${articleData.title}, high quality, journalistic style, sharp focus, 16:9 aspect ratio`;
      finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=1280&height=720&nologo=true&seed=${Date.now()}`;
    }

    if (finalImageUrl) {
      console.log(`[Bot] Internalizando imagen: ${finalImageUrl.slice(0, 60)}...`);
      finalImageUrl = await internalizeImage(finalImageUrl);

      // Guardia: si internalizeImage falló y la URL sigue siendo externa,
      // preferimos null antes que guardar una URL con hotlink bloqueado
      if (finalImageUrl && !finalImageUrl.includes('cloudinary.com')) {
        console.warn('[Bot] ⚠️ internalizeImage falló — imagen descartada para evitar hotlink roto');
        finalImageUrl = null;
      }
    }

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
