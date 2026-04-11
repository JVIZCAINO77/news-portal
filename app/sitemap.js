// app/sitemap.js — Generación dinámica de Sitemap para SEO en Imperio Público 2.0
import { getAllArticles } from '@/lib/serverData';
import { CATEGORIES, SITE_CONFIG } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function sitemap() {
  // Rutas estáticas base
  const routes = [
    {
      url: SITE_CONFIG.url,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ];

  // Categorías
  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${SITE_CONFIG.url}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  // Artículos individuales — con fallback seguro si Supabase falla en build
  let articleRoutes = [];
  try {
    const articles = await getAllArticles();
    articleRoutes = articles.map((article) => ({
      url: `${SITE_CONFIG.url}/articulo/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));
  } catch (err) {
    console.warn('[Sitemap] No se pudieron cargar artículos:', err?.message);
    // Devolver solo las rutas estáticas — no romper el build
  }

  return [...routes, ...categoryRoutes, ...articleRoutes];
}
