// lib/data.js — Core Configuration & Constants for Imperio Público 2.0
export const SITE_CONFIG = {
  name: 'Imperio Público',
  tagline: 'El Poder de la Información Veraz',
  description: 'Tu portal líder de noticias y artículos de opinión. Información veraz, poder informativo y periodismo objetivo en tiempo real.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://imperiopublico.com',
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
 * Reemplaza estos IDs ('placeholder-...') por los IDs numéricos que obtengas
 * en tu panel de Google AdSense -> Anuncios -> Bloques de anuncios.
 */
export const ADS_SLOTS = {
  home_sidebar: 'placeholder-home-sidebar',
  article_mid:  'placeholder-article-mid',
  article_sidebar: 'placeholder-article-sidebar',
  category_top: 'placeholder-category-top',
};

export const CATEGORIES = [
  { slug: 'noticias',        label: 'Noticias',        color: '#bb1b21' },
  { slug: 'politica',        label: 'Política',         color: '#1f2937' },
  { slug: 'economia',        label: 'Economía',         color: '#1f2937' },
  { slug: 'internacional',   label: 'Internacional',    color: '#1f2937' },
  { slug: 'deportes',        label: 'Deportes',         color: '#1f2937' },
  { slug: 'sucesos',         label: 'Sucesos',          color: '#1f2937' },
  { slug: 'salud',           label: 'Salud',            color: '#1f2937' },
  { slug: 'entretenimiento', label: 'Entretenimiento',  color: '#1f2937' },
  { slug: 'cultura',         label: 'Cultura',          color: '#1f2937' },
  { slug: 'tecnologia',      label: 'Tecnología',       color: '#1f2937' },
  { slug: 'tendencias',      label: 'Tendencias',       color: '#1f2937' },
  { slug: 'opinion',         label: 'Opinión',          color: '#1f2937' },
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
