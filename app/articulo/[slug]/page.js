// app/articulo/[slug]/page.js — Página de artículo individual (SSR + SEO completo)
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getArticleBySlug, getAllArticles, getLatestArticles } from '@/lib/serverData';
import { getCategoryBySlug, formatDate, SITE_CONFIG } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import AdUnit from '@/components/AdUnit';

// Genera rutas estáticas para todos los artículos (SSG)
export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

// Metadata dinámica por artículo — crucial para SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Artículo no encontrado' };

  const cat = getCategoryBySlug(article.category);

  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.tags,
    authors: [{ name: article.author }],
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      url: `/articulo/${article.slug}`,
      images: [{ url: article.image, width: 800, alt: article.imageAlt || article.title }],
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      section: cat?.label,
      tags: article.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
    alternates: { canonical: `/articulo/${article.slug}` },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const cat = getCategoryBySlug(article.category);
  const articlesLatest = await getLatestArticles(3);
  const related = articlesLatest.filter((a) => a.id !== article.id).slice(0, 3);

  // JSON-LD NewsArticle — máxima visibilidad en buscadores y motores IA
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: [article.image],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author,
      description: article.authorBio,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: { '@type': 'ImageObject', url: `${SITE_CONFIG.url}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_CONFIG.url}/articulo/${article.slug}` },
    articleSection: cat?.label,
    keywords: article.tags?.join(', '),
    wordCount: article.content?.split(' ').length,
    timeRequired: `PT${article.readTime}M`,
    inLanguage: 'es',
    isAccessibleForFree: true,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_CONFIG.url },
      { '@type': 'ListItem', position: 2, name: cat?.label, item: `${SITE_CONFIG.url}/categoria/${article.category}` },
      { '@type': 'ListItem', position: 3, name: article.title, item: `${SITE_CONFIG.url}/articulo/${article.slug}` },
    ],
  };

  // Formatear contenido como HTML básico
  const htmlContent = article.content
    ?.split('\n\n')
    .map((para) => {
      if (para.startsWith('**') && para.endsWith('**')) {
        return `<h2>${para.slice(2, -2)}</h2>`;
      }
      return `<p>${para
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.+?)__/g, '<em>$1</em>')
      }</p>`;
    })
    .join('');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ marginBottom: 20 }}>
          <ol style={{ display: 'flex', gap: 8, listStyle: 'none', fontSize: 13, color: 'var(--color-text-dim)', flexWrap: 'wrap' }}>
            <li><Link href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>Inicio</Link></li>
            <li style={{ opacity: 0.4 }}>›</li>
            {cat && <li><Link href={`/categoria/${article.category}`} style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>{cat.label}</Link></li>}
            <li style={{ opacity: 0.4 }}>›</li>
            <li style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{article.title}</li>
          </ol>
        </nav>

        {/* Ad leaderboard */}
        <div style={{ marginBottom: 24 }}>
          <AdUnit slot="1234567890" format="leaderboard" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─ Columna principal del artículo ─ */}
          <article className="lg:col-span-2" itemScope itemType="https://schema.org/NewsArticle">

            {/* Categoría */}
            {cat && (
              <Link href={`/categoria/${article.category}`} style={{ textDecoration: 'none' }}>
                <span className="cat-badge" style={{ background: cat.color, color: '#fff', marginBottom: 16, display: 'inline-flex' }}>
                  {cat.emoji} {cat.label}
                </span>
              </Link>
            )}

            {/* Titular */}
            <h1
              itemProp="headline"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)',
                fontWeight: 900, color: '#fff',
                lineHeight: 1.2, marginBottom: 16,
              }}
            >
              {article.title}
            </h1>

            {/* Entradilla */}
            <p style={{
              fontSize: '1.15rem', color: '#d1d5db',
              lineHeight: 1.7, marginBottom: 20,
              paddingLeft: 14, borderLeft: '3px solid var(--color-primary)',
              fontFamily: 'var(--font-serif)',
            }}>
              {article.excerpt}
            </p>

            {/* Meta del autor */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)',
              marginBottom: 24,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 18, color: '#fff', flexShrink: 0,
              }}>
                {article.author?.[0]}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }} itemProp="author" itemScope itemType="https://schema.org/Person">
                  <span itemProp="name">{article.author}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{article.authorBio}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }} itemProp="datePublished" content={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
                  {article.readTime} min lectura · 👁 {article.views?.toLocaleString('es')} vistas
                </div>
              </div>
            </div>

            {/* Imagen destacada */}
            <div style={{ position: 'relative', aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', marginBottom: 28 }}>
              <Image
                src={article.image}
                alt={article.imageAlt || article.title}
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                style={{ objectFit: 'cover' }}
                priority
                itemProp="image"
              />
            </div>
            {article.imageAlt && (
              <p style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: -20, marginBottom: 24, textAlign: 'center', fontStyle: 'italic' }}>
                {article.imageAlt}
              </p>
            )}

            {/* Contenido */}
            <div
              className="prose-article"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              itemProp="articleBody"
            />

            {/* Ad in-article */}
            <div style={{ margin: '32px 0' }}>
              <AdUnit slot="1122334455" format="in-article" />
            </div>

            {/* Tags */}
            {article.tags && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 24 }}>
                {article.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)',
                    background: 'var(--color-surface-2)', padding: '4px 12px', borderRadius: 4,
                    border: '1px solid var(--color-border)',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Share */}
            <div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: '🐦 Twitter/X', color: '#1DA1F2' },
                { label: '👥 Facebook', color: '#4267B2' },
                { label: '💬 WhatsApp', color: '#25D366' },
                { label: '📋 Copiar enlace', color: 'var(--color-surface-3)' },
              ].map(({ label, color }) => (
                <button
                  key={label}
                  style={{
                    padding: '8px 16px', borderRadius: 6, border: 'none',
                    background: color, color: '#fff', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'opacity 0.2s',
                  }}
                  className="hover:opacity-80"
                >
                  {label}
                </button>
              ))}
            </div>
          </article>

          {/* ─ Sidebar ─ */}
          <aside>
            {/* Ad Rectangle */}
            <div style={{ marginBottom: 20, position: 'sticky', top: 90 }}>
              <AdUnit slot="9876543210" format="rectangle" />

              {/* Artículos relacionados */}
              <div style={{
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 8, padding: 16, marginTop: 20,
              }}>
                <h3 className="section-title" style={{ marginBottom: 12, fontSize: '0.95rem' }}>También te puede interesar</h3>
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="small" />
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* Noticias relacionadas */}
        <section style={{ marginTop: 48 }}>
          <h2 className="section-title" style={{ marginBottom: 20 }}>📰 Más Noticias</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} variant="medium" />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
