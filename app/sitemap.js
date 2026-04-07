// app/sitemap.js — Generación dinámica de Sitemap para SEO en PulsoNoticias 2.0
import { getAllArticles } from '@/lib/serverData';
import { CATEGORIES, SITE_CONFIG } from '@/lib/data';

export default async function sitemap() {
  const articles = await getAllArticles();

  // 1. Home
  const routes = [
    {
      url: SITE_CONFIG.url,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
  ];

  // 2. Categorías
  const categoryRoutes = CATEGORIES.map((cat) => ({
    url: `${SITE_CONFIG.url}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  // 3. Artículos individuales
  const articleRoutes = articles.map((article) => ({
    url: `${SITE_CONFIG.url}/articulo/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...routes, ...categoryRoutes, ...articleRoutes];
}
