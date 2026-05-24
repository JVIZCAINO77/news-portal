// lib/data.js — Core Configuration & Constants for Imperio Público 2.0
export const SITE_CONFIG = {
  name: 'Imperio Público',
  tagline: 'El Poder de la Información Veraz',
  description: 'Tu portal líder de noticias y artículos de opinión. Información veraz, poder informativo y periodismo objetivo en tiempo real.',
  url: 'https://imperiopublico.com', // HARDCODED para evitar errores de Vercel en el Sitemap
  logo: '/logo.png',
  adsenseId: process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-9579937391435747',
  publisherId: 'pub-9579937391435747', // ID sin prefijo 'ca-' para meta tags de verificación
  twitterHandle: '@imperiopublico',
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61573298082093',
    instagram: 'https://www.instagram.com/imperiopublico/',
    twitter: 'https://x.com/imperiopublico',
    youtube: 'https://www.youtube.com/@Imperiopublico',
    whatsapp: '8296371008'
  },
  locale: 'es_DO',
  gaId: process.env.NEXT_PUBLIC_GA_ID || 'G-LR8G6T2L69', // Google Analytics 4 ID (G-XXXXXXXXXX)
  showAds: true, 
};

/**
 * CONFIGURACIÓN DE BLOQUES DE ANUNCIOS (Google AdSense)
 * Configura los IDs en Vercel › Settings › Environment Variables:
 *
 *   NEXT_PUBLIC_ADSENSE_SLOT_HOME_SIDEBAR    → ID del bloque sidebar homepage
 *   NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_MID     → ID del bloque in-article
 *   NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_SIDEBAR → ID del bloque sidebar artículo
 *   NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY_TOP    → ID del bloque top de categoría
 *
 * Los IDs los encuentras en: AdSense › Anuncios › Bloques de anuncios
 * Mientras sean placeholders, los espacios se reservan pero NO muestran anuncios.
 */
export const ADS_SLOTS = {
  home_sidebar:    process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_SIDEBAR    || 'placeholder-home-sidebar',
  article_mid:     process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_MID     || 'placeholder-article-mid',
  article_sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_SIDEBAR || 'placeholder-article-sidebar',
  category_top:    process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATEGORY_TOP    || 'placeholder-category-top',
};

// true cuando todos los slots reales están configurados
export const ADS_READY = !Object.values(ADS_SLOTS).some(v => v.startsWith('placeholder'));

export const CATEGORIES = [
  // ─── Barra de nav principal ────────────────────────────────────────────────
  { slug: 'politica',        label: 'Política',         color: '#1f2937', nav: true  },
  { slug: 'policia',         label: 'Policía',          color: '#1f2937', nav: true  },
  { slug: 'deportes',        label: 'Deportes',         color: '#1f2937', nav: true  },
  { slug: 'tecnologia',      label: 'Tecnología',       color: '#1f2937', nav: true  },
  { slug: 'sucesos',         label: 'Sucesos',          color: '#1f2937', nav: true  },
  { slug: 'entretenimiento', label: 'Entretenimiento',  color: '#1f2937', nav: true  },
  { slug: 'economia',        label: 'Economía',         color: '#1f2937', nav: true  },
  { slug: 'internacional',   label: 'Internacional',    color: '#1f2937', nav: true  },
  { slug: 'salud',           label: 'Salud',            color: '#1f2937', nav: true  },
  { slug: 'cultura',         label: 'Cultura',          color: '#1f2937', nav: true  },

  // ─── República ─────────────────────────────────────────────────────────────
  { slug: 'nacional',        label: 'Nacional',         color: '#1f2937', nav: false },
  { slug: 'opinion',         label: 'Opinión',          color: '#1f2937', nav: false },
  { slug: 'gobierno',        label: 'Gobierno',         color: '#1f2937', nav: false },
  { slug: 'justicia',        label: 'Justicia',         color: '#1f2937', nav: false },
  { slug: 'congreso',        label: 'Congreso',         color: '#1f2937', nav: false },
  { slug: 'educacion',       label: 'Educación',        color: '#1f2937', nav: false },
  { slug: 'ciudad',          label: 'Ciudad',           color: '#1f2937', nav: false },
  { slug: 'migracion',       label: 'Migración',        color: '#1f2937', nav: false },
  { slug: 'sector-salud',    label: 'Sector Salud',     color: '#1f2937', nav: false },
  { slug: 'provincias',      label: 'Provincias',       color: '#1f2937', nav: false },

  // ─── Deportes sub-secciones ────────────────────────────────────────────────
  { slug: 'guia-deportiva',  label: 'Guía Deportiva',   color: '#1f2937', nav: false },
  { slug: 'golf',            label: 'Golf',             color: '#1f2937', nav: false },
  { slug: 'formula-1',       label: 'Fórmula 1',        color: '#1f2937', nav: false },

  // ─── Mundiales ─────────────────────────────────────────────────────────────
  { slug: 'eeuu',            label: 'EE.UU.',           color: '#1f2937', nav: false },
  { slug: 'haiti',           label: 'Haití',            color: '#1f2937', nav: false },
  { slug: 'espana',          label: 'España',           color: '#1f2937', nav: false },
  { slug: 'puerto-rico',     label: 'Puerto Rico',      color: '#1f2937', nav: false },
  { slug: 'europa',          label: 'Europa',           color: '#1f2937', nav: false },
  { slug: 'china',           label: 'China',            color: '#1f2937', nav: false },
  { slug: 'el-caribe',       label: 'El Caribe',        color: '#1f2937', nav: false },
  { slug: 'venezuela',       label: 'Venezuela',        color: '#1f2937', nav: false },
  { slug: 'america',         label: 'América',          color: '#1f2937', nav: false },
  { slug: 'asia',            label: 'Asia',             color: '#1f2937', nav: false },
  { slug: 'africa',          label: 'África',           color: '#1f2937', nav: false },

  // ─── Entretenimiento sub-secciones ────────────────────────────────────────
  { slug: 'farandula',       label: 'Farándula',        color: '#1f2937', nav: false },
  { slug: 'conciertos',      label: 'Conciertos',       color: '#1f2937', nav: false },
  { slug: 'cine',            label: 'Cine',             color: '#1f2937', nav: false },
  { slug: 'musica',          label: 'Música',           color: '#1f2937', nav: false },
  { slug: 'juegos',          label: 'Juegos',           color: '#1f2937', nav: false },
  { slug: 'cartelera',       label: 'Cartelera',        color: '#1f2937', nav: false },
  { slug: 'urbano',          label: 'Urbano',           color: '#1f2937', nav: false },
  { slug: 'teatro',          label: 'Teatro',           color: '#1f2937', nav: false },
  { slug: 'series',          label: 'Series',           color: '#1f2937', nav: false },
  { slug: 'tv',              label: 'TV',               color: '#1f2937', nav: false },
  { slug: 'radio',           label: 'Radio',            color: '#1f2937', nav: false },

  // ─── Vida sub-secciones ────────────────────────────────────────────────────
  { slug: 'turismo',         label: 'Turismo',          color: '#1f2937', nav: false },
  { slug: 'gastronomia',     label: 'Gastronomía',      color: '#1f2937', nav: false },
  { slug: 'virales',         label: 'Virales',          color: '#1f2937', nav: false },
  { slug: 'moda',            label: 'Moda',             color: '#1f2937', nav: false },
  { slug: 'historia',        label: 'Historia',         color: '#1f2937', nav: false },
  { slug: 'religion',        label: 'Religión',         color: '#1f2937', nav: false },

  // ─── Economía sub-secciones ───────────────────────────────────────────────
  { slug: 'finanzas',        label: 'Finanzas',         color: '#1f2937', nav: false },
  { slug: 'combustible',     label: 'Combustible',      color: '#1f2937', nav: false },
  { slug: 'emprendimiento',  label: 'Emprendimiento',   color: '#1f2937', nav: false },
  { slug: 'energia',         label: 'Energía',          color: '#1f2937', nav: false },
  { slug: 'industria',       label: 'Industria',        color: '#1f2937', nav: false },
  { slug: 'empleo',          label: 'Empleo',           color: '#1f2937', nav: false },
  { slug: 'medio-ambiente',  label: 'Medio Ambiente',   color: '#1f2937', nav: false },
  { slug: 'sector-turistico',label: 'Sector Turístico', color: '#1f2937', nav: false },

  // ─── Alias legado ─────────────────────────────────────────────────────────
  { slug: 'noticias',        label: 'Nacional',         color: '#1f2937', nav: false },
];


/**
 * parseTags — Convierte CUALQUIER formato de tags de Supabase a un array limpio.
 * Maneja: array nativo, string Postgres {"a","b"}, JSON ["a","b"], texto "a,b,#c"
 */
export function parseTags(raw) {
  if (!raw) return [];

  // Ya es un array nativo
  if (Array.isArray(raw)) {
    return raw
      .map(t => String(t).trim().replace(/^#+/, '').replace(/[_\s]+/g, ''))
      .filter(Boolean);
  }

  if (typeof raw !== 'string') return [];

  let str = raw.trim();

  // Formato PostgreSQL: {"CarlosBatista","periodistadominicano"}
  if (str.startsWith('{') && str.endsWith('}')) {
    str = str.slice(1, -1);
    return str
      .split(',')
      .map(t => t.replace(/^"|"$/g, '').trim().replace(/^#+/, '').replace(/[_\s]+/g, ''))
      .filter(Boolean);
  }

  // Formato JSON: ["CarlosBatista","periodistadominicano"]
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed
          .map(t => String(t).trim().replace(/^#+/, '').replace(/[_\s]+/g, ''))
          .filter(Boolean);
      }
    } catch { /* caer al siguiente caso */ }
  }

  // Texto plano separado por comas: "CarlosBatista, #periodistadominicano"
  return str
    .split(',')
    .map(t => t.trim().replace(/^#+/, '').replace(/[_\s]+/g, ''))
    .filter(Boolean);
}


/**
 * optimizeImageUrl — Limpia y valida URLs de imagen.
 * Aplicamos transforms rápidos (f_auto, q_auto) para máxima velocidad de carga.
 */
export function optimizeImageUrl(url, width = 1200) {
  if (!url) return '/icon.png';

  // Cloudinary Fetch mode (image/fetch/) — imagen externa servida via CDN de Cloudinary
  if (url.includes('cloudinary.com') && url.includes('/image/fetch/')) {
    try {
      const transform = `f_auto,q_auto:good,w_${width},c_limit`;
      // Formato: .../image/fetch/{ENCODED_URL} o .../image/fetch/{transforms}/{ENCODED_URL}
      const fetchIdx = url.indexOf('/image/fetch/') + '/image/fetch/'.length;
      const afterFetch = url.slice(fetchIdx);
      // Si ya hay transforms antes de la URL (que empieza con http%3A o https%3A)
      const hasTransforms = !afterFetch.startsWith('http');
      if (hasTransforms) {
        const slashIdx = afterFetch.indexOf('/');
        return url.slice(0, fetchIdx) + transform + '/' + afterFetch.slice(slashIdx + 1);
      } else {
        return url.slice(0, fetchIdx) + transform + '/' + afterFetch;
      }
    } catch (_) {
      return url;
    }
  }

  // Cloudinary Upload mode (image/upload/) — imagen propia
  if (url.includes('cloudinary.com')) {
    try {
      if (url.includes('/upload/')) {
        // c_limit: respeta el aspect ratio, solo reduce si excede el ancho máximo
        const transform = `f_auto,q_auto:good,w_${width},c_limit`;
        const uploadIdx = url.indexOf('/upload/') + '/upload/'.length;
        const afterUpload = url.slice(uploadIdx);

        // Si ya hay transforms (el segmento antes del nombre del archivo no tiene extensión)
        const firstSlash = afterUpload.indexOf('/');
        const firstSegment = firstSlash > -1 ? afterUpload.slice(0, firstSlash) : afterUpload;
        const hasExistingTransforms = firstSlash > -1 && !firstSegment.includes('.');

        if (hasExistingTransforms) {
          return url.slice(0, uploadIdx) + transform + afterUpload.slice(firstSlash);
        } else {
          return url.slice(0, uploadIdx) + transform + '/' + afterUpload;
        }
      }
    } catch (_) {
      return url;
    }
  }

  // Unsplash — parámetros nativos de CDN (rápidos, sin proxy)
  if (url.includes('unsplash.com')) {
    return `${url.split('?')[0]}?w=${width}&q=80&auto=format,compress&fit=crop&g=entropy`;
  }

  // Pollinations AI (imágenes generadas)
  if (url.includes('pollinations.ai')) {
    return `${url}${url.includes('?') ? '&' : '?'}width=${width}&height=${Math.round(width * 0.5625)}&nologo=true`;
  }

  return url;
}

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function calculateReadingTime(text) {
  if (!text) return 0;
  const wordsPerMinute = 225; // Promedio para lectura de adultos
  const noOfWords = text.split(/\s+/).length;
  const minutes = noOfWords / wordsPerMinute;
  return Math.ceil(minutes);
}
