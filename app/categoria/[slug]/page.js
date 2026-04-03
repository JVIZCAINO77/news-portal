// app/categoria/[slug]/page.js — Página de categoría
import { notFound } from 'next/navigation';
import { getArticlesByCategory } from '@/lib/serverData';
import { CATEGORIES, getCategoryBySlug, SITE_CONFIG } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import AdUnit from '@/components/AdUnit';

export async function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: 'Categoría no encontrada' };

  return {
    title: `${cat.emoji} ${cat.label} — ${SITE_CONFIG.name}`,
    description: `Las últimas noticias de ${cat.label}. Mantente informado con la información más reciente en ${cat.label.toLowerCase()} en ${SITE_CONFIG.name}.`,
    alternates: { canonical: `/categoria/${slug}` },
    openGraph: {
      title: `${cat.label} — ${SITE_CONFIG.name}`,
      description: `Últimas noticias de ${cat.label}`,
      type: 'website',
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) notFound();

  const articles = await getArticlesByCategory(slug, 20);

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_CONFIG.url },
      { '@type': 'ListItem', position: 2, name: cat.label, item: `${SITE_CONFIG.url}/categoria/${slug}` },
    ],
  };

  const topArticle = articles[0];
  const rest = articles.slice(1);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Header de categoría */}
      <div style={{
        background: `linear-gradient(135deg, ${cat.color}22, transparent)`,
        borderBottom: '1px solid var(--color-border)',
        padding: '40px 16px',
      }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 48 }}>{cat.emoji}</span>
            <div>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 900, color: '#fff', lineHeight: 1,
              }}>
                {cat.label}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 6 }}>
                {articles.length} artículos · Actualizado al instante
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Ad */}
        <div style={{ marginBottom: 24 }}>
          <AdUnit slot="1234567890" format="leaderboard" />
        </div>

        {/* Artículo principal de la categoría */}
        {topArticle && (
          <div style={{ marginBottom: 32 }}>
            <ArticleCard article={topArticle} variant="hero" />
          </div>
        )}

        {/* Grid de artículos */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((article, i) => (
              <div key={article.id} className="contents">
                <ArticleCard article={article} variant="medium" />
                {/* Ad cada 6 artículos */}
                {(i + 1) % 6 === 0 && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <AdUnit slot="1122334455" format="leaderboard" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {articles.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, color: 'var(--color-text-muted)' }}>
            <p style={{ fontSize: 64, marginBottom: 16 }}>📭</p>
            <p style={{ fontSize: 18 }}>Aún no hay artículos en esta sección.</p>
            <p style={{ fontSize: 14, marginTop: 8 }}>¡Vuelve pronto o ve al panel de administración para publicar contenido!</p>
          </div>
        )}

        {/* Ad final */}
        <div style={{ marginTop: 40 }}>
          <AdUnit slot="5544332211" format="leaderboard" />
        </div>
      </div>
    </>
  );
}
