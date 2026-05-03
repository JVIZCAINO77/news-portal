import { getLatestArticles } from '@/lib/serverData';
import { SITE_CONFIG } from '@/lib/data';

// RSS se actualiza cada 5 min — no necesita ser completamente dinámico
export const revalidate = 300;

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function GET() {
  const articles = await getLatestArticles(30);

  const feedItems = articles
    .map((article) => {
      const url = escapeXml(`${SITE_CONFIG.url}/articulo/${article.slug}`);
      const imageUrl = article.image ? escapeXml(article.image) : null;
      const category = escapeXml(article.category || 'noticias');
      const author = escapeXml(article.author || SITE_CONFIG.name);
      const tags = Array.isArray(article.tags) && article.tags.length > 0
        ? article.tags.map(t => `<category>${escapeXml(t)}</category>`).join('\n      ')
        : '';

      return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${article.excerpt || ''}]]></description>
      <dc:creator><![CDATA[${author}]]></dc:creator>
      <category>${category}</category>
      ${tags}
      ${imageUrl ? `<media:content url="${imageUrl}" medium="image" />\n      <media:thumbnail url="${imageUrl}" />` : ''}
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:media="http://search.yahoo.com/mrss/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_CONFIG.name}</title>
    <link>${SITE_CONFIG.url}</link>
    <atom:link href="${SITE_CONFIG.url}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${SITE_CONFIG.description}</description>
    <language>es-DO</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <managingEditor>info@imperiopublico.com (${SITE_CONFIG.name})</managingEditor>
    <image>
      <url>${SITE_CONFIG.url}/og-image.png</url>
      <title>${SITE_CONFIG.name}</title>
      <link>${SITE_CONFIG.url}</link>
    </image>
    ${feedItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
