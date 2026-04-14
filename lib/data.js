// lib/data.js — Core Configuration & Constants for Imperio Público 2.0
export const SITE_CONFIG = {
  name: 'Imperio Público',
  tagline: 'El Poder de la Información Veraz',
  description: 'Tu portal líder de noticias y artículos de opinión. Información veraz, poder informativo y periodismo objetivo en tiempo real.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://imperiopublico.com',
  logo: '/logo.png',
  adsenseId: process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-XXXXXXXXXXXXXXXXX',
  twitterHandle: '@imperiopublico',
  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61573298082093',
    instagram: 'https://www.instagram.com/imperiopublico/',
    twitter: 'https://x.com/imperiopublico',
    youtube: 'https://www.youtube.com/@Imperiopublico'
  },
  locale: 'es_DO',
  gaId: process.env.NEXT_PUBLIC_GA_ID || '', // Google Analytics 4 ID (G-XXXXXXXXXX)
};

export const CATEGORIES = [
  { slug: 'noticias', label: 'Noticias', color: '#bb1b21' },
  { slug: 'entretenimiento', label: 'Entretenimiento', color: '#1f2937' },
  { slug: 'deportes', label: 'Deportes', color: '#1f2937' },
  { slug: 'tecnologia', label: 'Tecnología', color: '#1f2937' },
  { slug: 'opinion', label: 'Opinión', color: '#1f2937' },
  { slug: 'cultura', label: 'Cultura', color: '#1f2937' },
  { slug: 'economia', label: 'Economía', color: '#1f2937' },
  { slug: 'salud', label: 'Salud', color: '#1f2937' },
  { slug: 'sucesos', label: 'Sucesos', color: '#1f2937' },
  { slug: 'tendencias', label: 'Tendencias', color: '#1f2937' },
  { slug: 'internacional', label: 'Internacional', color: '#1f2937' },
  { slug: 'politica', label: 'Política', color: '#1f2937' }
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
