// lib/data.js — Core Configuration & Constants for PulsoNoticias 2.0
export const SITE_CONFIG = {
  name: 'PulsoNoticias',
  tagline: 'Líder en RD e Información Clave en Latinoamérica',
  description: 'Tu primer medio de artículos en República Dominicana. Tendencias en LATAM, noticias veraces y periodismo objetivo en tiempo real.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://pulsonoticias.com',
  logo: '/logo.png',
  adsenseId: process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-XXXXXXXXXXXXXXXXX',
  twitterHandle: '@pulsonoticias',
  locale: 'es_DO',
};

export const CATEGORIES = [
  { slug: 'noticias', label: 'Noticias', color: '#d90429' },
  { slug: 'entretenimiento', label: 'Entretenimiento', color: '#1f2937' },
  { slug: 'deportes', label: 'Deportes', color: '#1f2937' },
  { slug: 'tecnologia', label: 'Tecnología', color: '#1f2937' },
  { slug: 'opinion', label: 'Opinión', color: '#1f2937' },
  { slug: 'cultura', label: 'Cultura', color: '#1f2937' },
  { slug: 'economia', label: 'Economía', color: '#1f2937' },
  { slug: 'salud', label: 'Salud', color: '#1f2937' },
];

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
