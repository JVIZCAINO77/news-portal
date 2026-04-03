// app/page.js — Página Principal del Portal
import Link from 'next/link';
import { getFeaturedArticles, getTrendingArticles, getLatestArticles, getArticlesByCategory } from '@/lib/serverData';
import { CATEGORIES } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import AdUnit from '@/components/AdUnit';

export const metadata = {
  title: 'PulsoNoticias — Tu fuente de noticias y entretenimiento',
  description: 'Noticias de actualidad, entretenimiento, deportes, tecnología, cultura y economía. Información confiable y actualizada al instante para Latinoamérica.',
  alternates: { canonical: '/' },
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HomePage() {
  const featured = await getFeaturedArticles(2);
  const trending = await getTrendingArticles(5);
  const latest = await getLatestArticles(6);
  const entertainment = await getArticlesByCategory('entretenimiento', 3);
  const sports = await getArticlesByCategory('deportes', 3);
  const tech = await getArticlesByCategory('tecnologia', 3);

  const heroArticle = featured[0];
  const secondaryFeatured = featured[1];

  return (
    <>
      {/* ── Leaderboard Ad — Bajo el header ── */}
      <div style={{ background: 'var(--color-dark)', padding: '8px 16px' }}>
        <div className="max-w-7xl mx-auto">
          <AdUnit slot="1234567890" format="leaderboard" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">

        {/* ── HERO SECTION ── */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Artículo principal */}
            {heroArticle && (
              <div className="lg:col-span-2">
                <ArticleCard article={heroArticle} variant="hero" />
              </div>
            )}

            {/* Sidebar derecho — Trending + Ad */}
            <div className="flex flex-col gap-4">
              {/* Trending */}
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 8, padding: '16px',
              }}>
                <h2 className="section-title" style={{ marginBottom: 12, fontSize: '1rem' }}>🔥 Tendencias</h2>
                <div>
                  {trending.map((a, i) => (
                    <div key={a.id} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < trending.length - 1 ? '1px solid var(--color-border)' : 'none', alignItems: 'flex-start' }}>
                      <span style={{
                        fontSize: 22, fontWeight: 900, color: i === 0 ? 'var(--color-primary)' : 'var(--color-surface-3)',
                        fontFamily: 'var(--font-heading)', lineHeight: 1, flexShrink: 0, width: 28,
                      }}>
                        {i + 1}
                      </span>
                      <ArticleCard article={a} variant="list" className="flex-1" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Ad Rectangle — Sidebar */}
              <AdUnit slot="9876543210" format="rectangle" />
            </div>
          </div>
        </section>

        {/* ── ÚLTIMAS NOTICIAS ── */}
        <section className="mb-10">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 className="section-title">📰 Últimas Noticias</h2>
            <Link href="/categoria/noticias" style={{ fontSize: 12, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, letterSpacing: '0.04em' }}>
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {latest.map((article) => (
              <ArticleCard key={article.id} article={article} variant="medium" />
            ))}
          </div>
        </section>

        {/* ── Ad en artículos ── */}
        <div style={{ margin: '0 0 40px' }}>
          <AdUnit slot="1122334455" format="in-article" />
        </div>

        {/* ── SEGUNDA FILA: Entretenimiento + Deportes + Tech ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">

          {/* Entretenimiento */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>🎬 Entretenimiento</h2>
              <Link href="/categoria/entretenimiento" style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Ver más →</Link>
            </div>
            {entertainment.map((a) => (
              <ArticleCard key={a.id} article={a} variant="small" />
            ))}
          </section>

          {/* Deportes */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>⚽ Deportes</h2>
              <Link href="/categoria/deportes" style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Ver más →</Link>
            </div>
            {sports.map((a) => (
              <ArticleCard key={a.id} article={a} variant="small" />
            ))}
          </section>

          {/* Tecnología */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>💻 Tecnología</h2>
              <Link href="/categoria/tecnologia" style={{ fontSize: 11, color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Ver más →</Link>
            </div>
            {tech.map((a) => (
              <ArticleCard key={a.id} article={a} variant="small" />
            ))}
          </section>
        </div>

        {/* ── Artículo Destacado Secundario ── */}
        {secondaryFeatured && (
          <section className="mb-10">
            <h2 className="section-title" style={{ marginBottom: 16 }}>⭐ Destacado</h2>
            <ArticleCard article={secondaryFeatured} variant="hero" />
          </section>
        )}

        {/* ── Ad antes del footer ── */}
        <div style={{ margin: '0 0 32px' }}>
          <AdUnit slot="5544332211" format="leaderboard" />
        </div>

      </div>
    </>
  );
}
