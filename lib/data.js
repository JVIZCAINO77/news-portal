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
  { slug: 'deportes',        label: 'Deportes',         color: '#1f2937' },
  { slug: 'tecnologia',      label: 'Tecnología',       color: '#1f2937' },
  { slug: 'entretenimiento', label: 'Entretenimiento',  color: '#1f2937' },
  { slug: 'economia',        label: 'Economía',         color: '#1f2937' },
  { slug: 'internacional',   label: 'Internacional',    color: '#1f2937' },
  { slug: 'sucesos',         label: 'Sucesos',          color: '#1f2937' },
  { slug: 'tendencias',      label: 'Tendencias',       color: '#1f2937' },
  { slug: 'opinion',         label: 'Opinión',          color: '#1f2937' },
  { slug: 'salud',           label: 'Salud',            color: '#1f2937' },
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
