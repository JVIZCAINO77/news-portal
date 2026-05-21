// app/sitemap.js — Generación dinámica de Sitemap para SEO en Imperio Público 2.0
import { getAllArticles } from '@/lib/serverData';
import { CATEGORIES, SITE_CONFIG } from '@/lib/data';

// Google rastrea el sitemap cada pocas horas — ISR 1h es más que suficiente
export const revalidate = 3600;

export default async function sitemap() {
  // Rutas estáticas base
  const routes = [
    {
      url: SITE_CONFIG.url,
      lastModified: new Date(), // Portada: sí cambia en cada revalidación
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${SITE_CONFIG.url}/nosotros`,
      lastModified: new Date('2025-01-01'), // Fix M6: fecha real de última edición
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_CONFIG.url}/contacto`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  // Categorías
  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${SITE_CONFIG.url}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.85,
  }));

  // Artículos individuales — con fallback seguro si Supabase falla en build
  let articleRoutes = [];
  try {
    const articles = await getAllArticles();
    const now = Date.now();
    articleRoutes = articles.map((article) => {
      const ageMs = now - new Date(article.publishedAt).getTime();
      const isToday   = ageMs < 24 * 60 * 60 * 1000;       // menos de 24h
      const isRecent  = ageMs < 7 * 24 * 60 * 60 * 1000;   // menos de 7 días
      return {
        url: `${SITE_CONFIG.url}/articulo/${article.slug}`,
        lastModified: new Date(article.publishedAt),
        changeFrequency: isToday ? 'hourly' : isRecent ? 'daily' : 'weekly',
        priority: isToday ? 0.95 : isRecent ? 0.85 : 0.65,
      };
    });
  } catch (err) {
    console.warn('[Sitemap] No se pudieron cargar artículos:', err?.message);
    // Devolver solo las rutas estáticas — no romper el build
  }

  return [...routes, ...categoryRoutes, ...articleRoutes];
}
