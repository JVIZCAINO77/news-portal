// app/sitemap.js — Sitemap dinámico para SEO (usa artículos reales de Supabase)
import { getAllArticles } from '@/lib/serverData';
import { CATEGORIES, SITE_CONFIG } from '@/lib/data';

export default async function sitemap() {
  const articles = await getAllArticles();
  const baseUrl = SITE_CONFIG.url;

  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'hourly', priority: 1.0 },
    { url: `${baseUrl}/buscar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ];

  const categoryPages = CATEGORIES.map((cat) => ({
    url: `${baseUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  const articlePages = articles.map((article) => ({
    url: `${baseUrl}/articulo/${article.slug}`,
    lastModified: new Date(article.updatedAt || article.publishedAt),
    changeFrequency: 'weekly',
    priority: article.featured ? 0.9 : 0.7,
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}

