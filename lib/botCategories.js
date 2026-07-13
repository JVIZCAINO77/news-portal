/**
 * lib/botCategories.js — Configuración de categorías del bot editorial
 *
 * Contiene:
 *  • Constantes de límites operacionales del bot
 *  • BREAKING_KEYWORDS — palabras que indican noticia urgente
 *  • ROTATION_ORDER — orden determinista de rotación de secciones
 *  • CATEGORIES — fuentes RSS por sección
 *
 * TOPIC_BLOCKLIST y TOPIC_ALLOWLIST viven directamente en bot/route.js
 * por su tamaño. Esta separación mantiene el archivo de ruta manejable.
 */

export const DAILY_LIMIT_GLOBAL = 3;
// ~400 palabras mínimas — umbral AdSense de "contenido de valor"
export const MIN_CONTENT_LENGTH = 2800;
export const SEMANTIC_THRESHOLD = 0.25;

export const BREAKING_KEYWORDS = [
  'tirador','shooter','disparo','disparos','bala','atentado','ataque',
  'bomba','explosión','explosion','terrorista','terrorismo','asesinato',
  'homicidio','secuestro','rehén','rehenes',
  'evacuado','evacuación','emergencia','alerta','alarma',
  'incendio','derrumbe','accidente grave','catástrofe','desastre',
  'golpe de estado','coup','renuncia','dimisión','muerto','muertos',
  'fallece','fallecio','fallecida','herido','heridos','víctimas',
  'terremoto','sismo','tsunami','huracán','ciclón','inundación',
  'última hora','urgente','breaking','alerta roja','en vivo',
  'detenido','detenidos','arrestado','capturado','fugitivo',
  'histórico','historico','récord','record','crisis','inflación','alza','sube',
  'campeón','campeon','victoria','medalla','oro','clasifica',
  'escándalo','escandalo','corrupción','fraude','justicia',
];

export const ROTATION_ORDER = [
  'politica','policia','deportes','tecnologia','sucesos',
  'entretenimiento','economia','internacional','salud','cultura',
  'nacional','gobierno','justicia','congreso','educacion',
  'tendencias','farandula','musica','cine','virales',
  'moda','gastronomia','turismo',
  'finanzas','emprendimiento','medio-ambiente','provincias',
  'eeuu','haiti','espana','europa','opinion',
];

export const CATEGORIES = {
  politica: {
    slug: 'politica', author: 'Mesa Política', style: 'neutral, objetivo y analítico',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://noticiassin.com/feed/?s=politica',
      'https://elnuevodiario.com.do/feed/',
      'https://clavedigital.com.do/feed/',
      'https://eldia.com.do/feed/',
    ],
  },
  economia: {
    slug: 'economia', author: 'Redacción Económica', style: 'serio, financiero y accesible',
    feeds: [
      'https://www.diariolibre.com/rss/economia.xml',
      'https://almomento.net/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada',
      'https://www.infobae.com/feeds/rss/economia.xml',
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
      'https://www.france24.com/es/rss',
      'https://cnnespanol.cnn.com/feed/',
      'https://www.infobae.com/feeds/rss/salud.xml',
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
      'https://remolacha.net/feed/',
      'https://www.infobae.com/feeds/rss/cultura.xml',
      'https://cnnespanol.cnn.com/feed/',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  entretenimiento: {
    slug: 'entretenimiento', author: 'Sección Espectáculos', style: 'dinámico y ameno',
    feeds: [
      'https://www.diariolibre.com/rss/revista.xml',
      'https://remolacha.net/feed/',
      'https://www.diariolibre.com/rss/portada.xml',
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
      'https://www.france24.com/es/rss',
      'https://cnnespanol.cnn.com/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/sociedad/portada',
      'https://z101digital.com/feed/',
      'https://almomento.net/feed/',
    ],
  },
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
  internacional: {
    slug: 'internacional', author: 'Redacción Internacional', style: 'global, analítico y contextualizado para audiencia dominicana',
    feeds: [
      'https://www.bbc.com/mundo/index.xml',
      'https://www.france24.com/es/rss',
      'https://www.infobae.com/feeds/rss/mundo.xml',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada',
    ],
  },
  nacional: {
    slug: 'nacional', author: 'Redacción Nacional', style: 'periodístico objetivo y formal',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  'medio-ambiente': {
    slug: 'medio-ambiente', author: 'Sección Medio Ambiente', style: 'informativo y consciente',
    feeds: [
      'https://www.bbc.com/mundo/index.xml',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/clima-y-medio-ambiente/portada',
      'https://www.infobae.com/feeds/rss/tendencias.xml',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://www.france24.com/es/rss',
    ],
  },
  opinion: {
    slug: 'opinion', author: 'Mesa Editorial', style: 'opinión, análisis profundo y periodismo de criterio',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/opinion/portada',
      'https://www.france24.com/es/rss',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  gobierno: {
    slug: 'gobierno', author: 'Redacción Gubernamental', style: 'formal, institucional y objetivo',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://elnuevodiario.com.do/feed/',
      'https://z101digital.com/feed/',
    ],
  },
  justicia: {
    slug: 'justicia', author: 'Sección Judicial', style: 'riguroso, legal y objetivo',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://elnuevodiario.com.do/feed/',
      'https://z101digital.com/feed/',
    ],
  },
  congreso: {
    slug: 'congreso', author: 'Redacción Legislativa', style: 'formal, legislativo e informativo',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://elnuevodiario.com.do/feed/',
      'https://z101digital.com/feed/',
    ],
  },
  educacion: {
    slug: 'educacion', author: 'Sección Educación', style: 'informativo, formativo y esperanzador',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/sociedad/portada',
      'https://elnuevodiario.com.do/feed/',
      'https://www.bbc.com/mundo/index.xml',
    ],
  },
  provincias: {
    slug: 'provincias', author: 'Corresponsalía Nacional', style: 'cercano, comunitario e informativo',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://elnuevodiario.com.do/feed/',
      'https://z101digital.com/feed/',
      'https://lainformacion.com.do/feed/',
    ],
  },
  farandula: {
    slug: 'farandula', author: 'Sección Farándula', style: 'dinámico, ameno y entretenido',
    feeds: [
      'https://remolacha.net/feed/',
      'https://www.diariolibre.com/rss/revista.xml',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://z101digital.com/feed/',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  musica: {
    slug: 'musica', author: 'Mesa Musical', style: 'apasionado, cultural y conectado con el público dominicano',
    feeds: [
      'https://remolacha.net/feed/',
      'https://www.diariolibre.com/rss/revista.xml',
      'https://www.infobae.com/feeds/rss/cultura.xml',
      'https://elnuevodiario.com.do/feed/',
      'https://z101digital.com/feed/',
    ],
  },
  cine: {
    slug: 'cine', author: 'Sección Cine y Streaming', style: 'crítico, descriptivo y accesible',
    feeds: [
      'https://remolacha.net/feed/',
      'https://www.diariolibre.com/rss/revista.xml',
      'https://www.infobae.com/feeds/rss/cultura.xml',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/cultura/portada',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  virales: {
    slug: 'virales', author: 'Mesa de Virales', style: 'fresco, rápido y directo al punto',
    feeds: [
      'https://remolacha.net/feed/',
      'https://www.bbc.com/mundo/index.xml',
      'https://www.infobae.com/feeds/rss/tendencias.xml',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://cnnespanol.cnn.com/feed/',
    ],
  },
  moda: {
    slug: 'moda', author: 'Sección Moda y Estilo', style: 'elegante, moderno y aspiracional',
    feeds: [
      'https://remolacha.net/feed/',
      'https://www.diariolibre.com/rss/revista.xml',
      'https://www.infobae.com/feeds/rss/tendencias.xml',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/sociedad/portada',
      'https://elnuevodiario.com.do/feed/',
    ],
  },
  gastronomia: {
    slug: 'gastronomia', author: 'Sección Gastronomía', style: 'sabroso, descriptivo y cultural',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/sociedad/portada',
      'https://www.bbc.com/mundo/index.xml',
      'https://remolacha.net/feed/',
    ],
  },
  turismo: {
    slug: 'turismo', author: 'Sección Turismo', style: 'descriptivo, atractivo y orientado a viajeros',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://elnuevodiario.com.do/feed/',
      'https://www.france24.com/es/rss',
    ],
  },
  finanzas: {
    slug: 'finanzas', author: 'Redacción Financiera', style: 'técnico pero accesible',
    feeds: [
      'https://www.diariolibre.com/rss/economia.xml',
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada',
      'https://www.infobae.com/feeds/rss/economia.xml',
    ],
  },
  emprendimiento: {
    slug: 'emprendimiento', author: 'Sección Emprendimiento', style: 'inspirador, práctico y motivacional',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/economia/portada',
      'https://www.infobae.com/feeds/rss/economia.xml',
      'https://cnnespanol.cnn.com/feed/',
    ],
  },
  eeuu: {
    slug: 'eeuu', author: 'Corresponsal en EE.UU.', style: 'analítico, con contexto para audiencia dominicana y diáspora',
    feeds: [
      'https://cnnespanol.cnn.com/feed/',
      'https://www.bbc.com/mundo/index.xml',
      'https://www.france24.com/es/rss',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada',
      'https://www.infobae.com/feeds/rss/mundo.xml',
    ],
  },
  haiti: {
    slug: 'haiti', author: 'Redacción Fronteriza', style: 'objetivo, contextualizado y sensible a la realidad binacional',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://www.france24.com/es/rss',
      'https://www.bbc.com/mundo/index.xml',
    ],
  },
  espana: {
    slug: 'espana', author: 'Corresponsal en España', style: 'contextualizado para dominicanos en España y lectores nacionales',
    feeds: [
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/espana/portada',
      'https://elmundo.es/rss/portada.xml',
      'https://www.france24.com/es/rss',
      'https://www.bbc.com/mundo/index.xml',
      'https://cnnespanol.cnn.com/feed/',
    ],
  },
  europa: {
    slug: 'europa', author: 'Redacción Europa', style: 'global y analítico',
    feeds: [
      'https://www.france24.com/es/rss',
      'https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/internacional/portada',
      'https://www.bbc.com/mundo/index.xml',
      'https://www.dw.com/es/rss/noticias/rss-6617',
      'https://elmundo.es/rss/portada.xml',
    ],
  },
};
