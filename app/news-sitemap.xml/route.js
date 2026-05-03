// app/news-sitemap.xml/route.js — Google News Sitemap (formato especial para Google News/Discover)
import { getLatestArticles } from '@/lib/serverData';
import { SITE_CONFIG } from '@/lib/data';

export const revalidate = 1800; // ISR: regenerar cada 30 minutos (Google News indexa las últimas 48h)

function escapeXml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  // Google News solo indexa artículos de las últimas 48 horas
  const allArticles = await getLatestArticles(50);
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const recentArticles = allArticles.filter((a) => {
    const pub = new Date(a.publishedAt);
    return pub >= twoDaysAgo;
  });

  const items = recentArticles
    .map((article) => {
      const pubDate = new Date(article.publishedAt).toISOString();
      const url = `${SITE_CONFIG.url}/articulo/${escapeXml(article.slug)}`;
      const title = escapeXml(article.title);
      const keywords = Array.isArray(article.tags) && article.tags.length > 0
        ? escapeXml(article.tags.join(', '))
        : '';

      return `
  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_CONFIG.name)}</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${title}</news:title>
      ${keywords ? `<news:keywords>${keywords}</news:keywords>` : ''}
    </news:news>
  </url>`;
    })
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 's-maxage=1800, stale-while-revalidate',
    },
  });
}
