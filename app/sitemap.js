// app/sitemap.js — Sitemap dinámico para SEO
import { getAllArticles, CATEGORIES, SITE_CONFIG } from '@/lib/data';

export default function sitemap() {
  const articles = getAllArticles();
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
    lastModified: new Date(article.updatedAt),
    changeFrequency: 'weekly',
    priority: article.featured ? 0.9 : 0.7,
  }));

  return [...staticPages, ...categoryPages, ...articlePages];
}
