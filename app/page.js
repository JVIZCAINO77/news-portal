// app/page.js — Portada de Imperio Público — Portada + Secciones por Categoría
import Link from 'next/link';
import { getFeaturedArticles, getLatestArticles, getArticlesByCategory } from '@/lib/serverData';
import ArticleCard from '@/components/ArticleCard';
import NewsletterBox from '@/components/NewsletterBox';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export default async function HomePage() {
  // Fetch all data in parallel
  const [
    featured,
    latest,
    noticias,
    politica,
    deportes,
    tecnologia,
    entretenimiento,
    economia,
    cultura,
    salud,
    opinion,
  ] = await Promise.all([
    getFeaturedArticles(4),
    getLatestArticles(20),
    getArticlesByCategory('noticias', 6),
    getArticlesByCategory('politica', 5),
    getArticlesByCategory('deportes', 5),
    getArticlesByCategory('tecnologia', 5),
    getArticlesByCategory('entretenimiento', 5),
    getArticlesByCategory('economia', 5),
    getArticlesByCategory('cultura', 5),
    getArticlesByCategory('salud', 5),
    getArticlesByCategory('opinion', 4),
  ]);

  // Portada distribution
  let heroArticle = featured[0] || latest[0] || null;
  let sideFeatured = featured.slice(1, 4);
  if (sideFeatured.length < 3) {
    const extras = latest.filter(a => a.id !== heroArticle?.id).slice(0, 3 - sideFeatured.length);
    sideFeatured = [...sideFeatured, ...extras];
  }
  const featuredIds = new Set([heroArticle?.id, ...sideFeatured.map(a => a.id)]);
  const sidebarLatest = latest.filter(a => !featuredIds.has(a.id)).slice(0, 5);

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#111827' }}>

      {/* ══════════════════════════════════════════════
          1 — PORTADA
      ══════════════════════════════════════════════ */}
      <section aria-label="Portada Principal" className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-16 border-b-2 border-black">
        {/* Label */}
        <div className="flex items-center gap-4 mb-8">
          <span style={{ backgroundColor: '#000', color: '#fff' }} className="text-[9px] font-black uppercase tracking-[0.3em] px-4 py-2 italic">
            Portada
          </span>
          <span className="h-px flex-1 bg-gray-200"></span>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400 italic">
            Imperio Público
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Hero (7 cols) */}
          <div className="lg:col-span-7 lg:border-r lg:border-gray-200 lg:pr-10 mb-10 lg:mb-0">
            {heroArticle && <ArticleCard article={heroArticle} variant="hero" extraBadge="LO ÚLTIMO" />}
          </div>

          {/* Secundarios (3 cols) */}
          <div className="lg:col-span-3 lg:border-r lg:border-gray-200 lg:px-10 space-y-8 mb-10 lg:mb-0">
            {sideFeatured.map((art, i) => (
              <div key={art.id} className={i < sideFeatured.length - 1 ? 'pb-8 border-b border-gray-200' : ''}>
                <ArticleCard article={art} variant="medium" className="border-0 pb-0" />
              </div>
            ))}
          </div>

          {/* Sidebar En Directo (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <h4 style={{ color: '#bb1b21' }} className="text-[9px] font-black uppercase tracking-[0.35em] pb-2 border-b-2 border-red-600 inline-block italic">
              En Directo
            </h4>
            <div className="space-y-4">
              {sidebarLatest.map(a => (
                <ArticleCard key={a.id} article={a} variant="minimal" className="py-0 border-0" />
              ))}
            </div>
            <div className="pt-6 border-t border-gray-200">
              <NewsletterBox variant="compact" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          2 — NOTICIAS
      ══════════════════════════════════════════════ */}
      <CategorySection
        slug="noticias"
        label="Noticias"
        title="Últimas Noticias"
        articles={noticias.length > 0 ? noticias : latest.slice(0, 6)}
        layout="grid3"
        bg="white"
      />

      {/* ══════════════════════════════════════════════
          3 — POLÍTICA
      ══════════════════════════════════════════════ */}
      <CategorySection
        slug="politica"
        label="Política"
        title="Política Nacional"
        articles={politica}
        layout="leadGrid"
        bg="gray"
      />

      {/* ══════════════════════════════════════════════
          4 — DEPORTES
      ══════════════════════════════════════════════ */}
      <CategorySection
        slug="deportes"
        label="Deportes"
        title="Deportes"
        articles={deportes}
        layout="sportCards"
        bg="white"
      />

      {/* ══════════════════════════════════════════════
          5 — TECNOLOGÍA
      ══════════════════════════════════════════════ */}
      <CategorySection
        slug="tecnologia"
        label="Tecnología"
        title="Tecnología"
        articles={tecnologia}
        layout="wideFirst"
        bg="gray"
      />

      {/* ══════════════════════════════════════════════
          6 — ENTRETENIMIENTO
      ══════════════════════════════════════════════ */}
      <CategorySection
        slug="entretenimiento"
        label="Entretenimiento"
        title="Entretenimiento"
        articles={entretenimiento}
        layout="leadGrid"
        bg="white"
      />

      {/* ══════════════════════════════════════════════
          7 — ECONOMÍA
      ══════════════════════════════════════════════ */}
      <CategorySection
        slug="economia"
        label="Economía"
        title="Economía"
        articles={economia}
        layout="wideFirst"
        bg="gray"
      />

      {/* ══════════════════════════════════════════════
          8 — CULTURA
      ══════════════════════════════════════════════ */}
      <CategorySection
        slug="cultura"
        label="Cultura"
        title="Cultura"
        articles={cultura}
        layout="grid4"
        bg="white"
      />

      {/* ══════════════════════════════════════════════
          9 — SALUD
      ══════════════════════════════════════════════ */}
      <CategorySection
        slug="salud"
        label="Salud"
        title="Salud"
        articles={salud}
        layout="leadGrid"
        bg="gray"
      />

      {/* ══════════════════════════════════════════════
          10 — OPINIÓN
      ══════════════════════════════════════════════ */}
      <section aria-label="Sección Opinión" className="bg-white py-14 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <SectionHeader slug="opinion" label="Opinión" title="Voces que Definen la Agenda" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-10">
            <div className="lg:col-span-4 border-r border-gray-200 pr-12 hidden lg:block">
              <p style={{ color: '#6b7280' }} className="font-serif text-sm leading-relaxed italic">
                Análisis de profundidad por los expertos más influyentes del país. Perspectivas únicas sobre los temas que marcan la agenda nacional e internacional.
              </p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              {opinion.slice(0, 4).map(a => (
                <ArticleCard key={a.id} article={a} variant="editorial" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ backgroundColor: '#000' }} className="py-20 mt-0">
        <NewsletterBox />
      </section>

    </div>
  );
}

/* ────────────────────────────────────────────────
   SectionHeader
──────────────────────────────────────────────── */
function SectionHeader({ slug, label, title }) {
  return (
    <div className="flex items-end justify-between gap-4 pb-4 border-b-2 border-black">
      <div className="flex items-baseline gap-4">
        <span style={{ color: '#bb1b21' }} className="text-[9px] font-black uppercase tracking-[0.4em] italic">
          {label}
        </span>
        <h2 style={{ color: '#111827' }} className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">
          {title}
        </h2>
      </div>
      <Link
        href={`/categoria/${slug}`}
        style={{ color: '#bb1b21', borderColor: '#bb1b21' }}
        className="flex-shrink-0 text-[9px] font-black uppercase tracking-[0.25em] border px-5 py-2.5 transition-all hover:bg-red-600 hover:text-white hover:border-red-600"
      >
        Ver todo →
      </Link>
    </div>
  );
}

/* ────────────────────────────────────────────────
   CategorySection
──────────────────────────────────────────────── */
function CategorySection({ slug, label, title, articles, layout, bg = 'white' }) {
  if (!articles || articles.length === 0) return null;
  const bgStyle = bg === 'gray'
    ? { backgroundColor: '#f8f9fa' }
    : { backgroundColor: '#ffffff' };

  return (
    <section aria-label={`Sección ${label}`} style={bgStyle} className="py-14 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <SectionHeader slug={slug} label={label} title={title} />

        <div className="mt-10">

          {/* 3-column grid */}
          {layout === 'grid3' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
              {articles.slice(0, 6).map(a => (
                <ArticleCard key={a.id} article={a} variant="medium" />
              ))}
            </div>
          )}

          {/* 4-column grid */}
          {layout === 'grid4' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {articles.slice(0, 4).map(a => (
                <ArticleCard key={a.id} article={a} variant="medium" />
              ))}
            </div>
          )}

          {/* Lead article + secondary grid */}
          {layout === 'leadGrid' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-5 lg:border-r lg:border-gray-200 lg:pr-10">
                {articles[0] && <ArticleCard article={articles[0]} variant="medium" className="border-0 pb-0" />}
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 content-start">
                {articles.slice(1, 5).map(a => (
                  <ArticleCard key={a.id} article={a} variant="small" className="border-b border-gray-200 pb-8" />
                ))}
              </div>
            </div>
          )}

          {/* Wide first + list */}
          {layout === 'wideFirst' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7">
                {articles[0] && <ArticleCard article={articles[0]} variant="wide" />}
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6 justify-center">
                {articles.slice(1, 4).map(a => (
                  <ArticleCard key={a.id} article={a} variant="small" className="border-b border-gray-200 pb-6" />
                ))}
              </div>
            </div>
          )}

          {/* Sport cards with gradient overlay */}
          {layout === 'sportCards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {articles.slice(0, 4).map(a => (
                <Link key={a.id} href={`/articulo/${a.slug}`} className="group block">
                  <article>
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 mb-5">
                      {a.image && (
                        <img
                          src={a.image}
                          alt={a.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    </div>
                    <h3 style={{ color: '#111827' }} className="text-xl font-black uppercase tracking-tight leading-tight group-hover:text-red-600 transition-colors">
                      {a.title}
                    </h3>
                    <p style={{ color: '#9ca3af' }} className="text-[9px] font-black uppercase tracking-widest mt-3">
                      {formatDate(a.publishedAt)}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
}
