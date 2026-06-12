// app/page.js — Portada Imperio Público — Diseño Premium Editorial NYT/Bloomberg
import Link from 'next/link';
import { getDailyTopArticles, getLatestArticles } from '@/lib/serverData';
import { SITE_CONFIG, formatDate, calculateReadingTime } from '@/lib/data';
import PremiumImage from '@/components/PremiumImage';
import AdUnit from '@/components/AdUnit';
import ArticleCarousel from '@/components/ArticleCarousel';

export const revalidate = 300;

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Hace ${hrs} hora${hrs !== 1 ? 's' : ''}`;
  const days = Math.floor(hrs / 24);
  return `Hace ${days} día${days !== 1 ? 's' : ''}`;
}

function toTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' });
}

function CategoryBadge({ category, className = '' }) {
  return (
    <span className={`inline-block text-[0.55rem] font-bold uppercase tracking-[0.25em] text-[#C8102E] ${className}`}>
      {category === 'noticias' ? 'Nacional' : category}
    </span>
  );
}


export default async function HomePage() {
  const [dailyTop, latest] = await Promise.all([
    getDailyTopArticles(20, 6),
    getLatestArticles(30),
  ]);

  const clean = (str) => typeof str === 'string' ? str.replace(/#+\s*/g, '').trim() : str;
  const sanitize = (art) => ({ ...art, title: clean(art.title), excerpt: clean(art.excerpt) });

  const cleanedTop    = dailyTop.map(sanitize);
  const cleanedLatest = latest.map(sanitize);

  const pool = cleanedTop.length >= 15
    ? cleanedTop
    : [...cleanedTop, ...cleanedLatest].filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i);

  const enDesarrollo = [...cleanedLatest]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_CONFIG.name,
    "url": SITE_CONFIG.url,
    "logo": `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    "sameAs": [SITE_CONFIG.social.facebook, SITE_CONFIG.social.instagram, SITE_CONFIG.social.twitter, SITE_CONFIG.social.youtube],
  };

  return (
    <div className="bg-white text-[#111111]" style={{ fontFamily: 'var(--font-sans, Inter, sans-serif)' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── AD BANNER TOP ──────────────────────────────────────────────────── */}
      <AdUnit format="leaderboard" slot="home_top" className="mx-auto block text-center" />

      <main aria-label="Portada" className="max-w-[1280px] mx-auto px-5 md:px-8 lg:px-10">

        {/* ══════════════════════════════════════════════════════════════════
            BLOQUE 1 — HERO + LO MÁS LEÍDO
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 py-10 border-b border-[#E5E5E5]">

          {/* ── LEFT: ARTÍCULO PRINCIPAL ── */}
          <div className="lg:border-r border-[#E5E5E5] lg:pr-12">
            {pool[0] && (
              <Link href={`/articulo/${pool[0].slug}`} className="group block">
                {pool[0].image && (
                  <div className="relative overflow-hidden mb-6 shadow-[0_4px_24px_rgba(0,0,0,0.10)]">
                    <PremiumImage
                      src={pool[0].image}
                      alt={pool[0].title}
                      category={pool[0].category}
                      containerClassName="w-full aspect-[16/9] md:aspect-[21/9]"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                      priority={true}
                      width={1200}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#C8102E] text-white text-[0.5rem] font-bold uppercase tracking-[0.3em] px-3 py-1.5">
                        {pool[0].category === 'noticias' ? 'Nacional' : pool[0].category}
                      </span>
                    </div>
                  </div>
                )}

                <h1
                  className="editorial-title text-[2.6rem] md:text-[3.2rem] lg:text-[3.6rem] leading-[1.08] tracking-[-0.02em] text-[#111111] mb-5 group-hover:text-[#C8102E] transition-colors duration-300"
                >
                  {pool[0].title || 'Información en Desarrollo'}
                </h1>

                {pool[0].excerpt && (
                  <p className="text-[1.05rem] leading-[1.75] text-[#444444] mb-6 font-serif max-w-[680px]">
                    {pool[0].excerpt}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-5 border-t border-[#E5E5E5] text-[0.6rem] text-[#888888] font-semibold uppercase tracking-[0.2em]">
                  <span>Por {pool[0].author || 'Redacción'}</span>
                  <span className="text-[#E5E5E5]">|</span>
                  <span>{formatDate(pool[0].publishedAt)}</span>
                </div>
              </Link>
            )}
          </div>

          {/* ── RIGHT: LO MÁS LEÍDO 01–05 ── */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-5 border-b-[2px] border-[#111111]">
              <span className="text-[0.6rem] font-black uppercase tracking-[0.35em] text-[#111111]">Lo más leído</span>
              <Link href="/buscar?q=popular" className="text-[0.5rem] font-bold uppercase tracking-[0.2em] text-[#C8102E] hover:underline transition-all">
                Ver todo →
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-[#E5E5E5]">
              {pool.slice(1, 6).map((art) => (
                <Link key={art.id} href={`/articulo/${art.slug}`} className="group flex items-start gap-4 py-4 first:pt-0 last:pb-0 hover:bg-[#FAFAFA] transition-colors -mx-2 px-2 rounded-sm">

                  {/* Texto */}
                  <div className="flex-1 min-w-0">
                    <CategoryBadge category={art.category} className="mb-1 block" />
                    <h2 className="text-[0.8rem] font-bold leading-snug tracking-tight text-[#111111] group-hover:text-[#C8102E] transition-colors line-clamp-3">
                      {art.title}
                    </h2>
                    <span className="text-[0.5rem] text-[#AAAAAA] font-semibold uppercase tracking-widest mt-1.5 block">
                      {formatDate(art.publishedAt)}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  {art.image && (
                    <div className="w-[64px] h-[48px] flex-shrink-0 overflow-hidden rounded-sm shadow-sm">
                      <PremiumImage
                        src={art.image}
                        alt={art.title}
                        category={art.category}
                        containerClassName="w-full h-full"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                        width={120}
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── AD BANNER MID ─────────────────────────────────────────────── */}
        <AdUnit format="leaderboard" slot="home_mid" className="mx-auto block text-center" />

        {/* ══════════════════════════════════════════════════════════════════
            BLOQUE 2 — NOTICIAS DESTACADAS (izq) + EN DESARROLLO (der)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 py-10 border-b border-[#E5E5E5]">

          {/* ── NOTICIAS DESTACADAS — Carousel ── */}
          <div className="lg:border-r border-[#E5E5E5] lg:pr-12">
            <div className="flex items-center gap-3 pb-3 mb-7 border-b-[2px] border-[#111111]">
              <span className="text-[0.6rem] font-black uppercase tracking-[0.35em]">🔥 Noticias Destacadas</span>
            </div>
            <ArticleCarousel articles={pool.slice(6, 13)} visibleCount={3} />
          </div>

          {/* ── EN DESARROLLO — Timeline ── */}
          <div>
            <div className="flex items-center gap-2 pb-3 mb-5 border-b-[2px] border-[#111111]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#C8102E] rounded-full animate-pulse" />
                <span className="text-[0.6rem] font-black uppercase tracking-[0.35em]">En Desarrollo</span>
              </span>
            </div>

            <div className="relative">
              {/* Línea vertical */}
              <div className="absolute left-[42px] top-0 bottom-0 w-px bg-[#E5E5E5]" />

              <div className="space-y-0">
                {enDesarrollo.map((art, idx) => (
                  <Link key={art.id} href={`/articulo/${art.slug}`} className="group flex gap-4 items-start py-4 border-b border-[#F0F0F0] last:border-0 hover:bg-[#FAFAFA] -mx-2 px-2 rounded-sm transition-colors">
                    {/* Hora */}
                    <div className="w-10 shrink-0 text-right">
                      <span className="text-[0.5rem] font-black text-[#C8102E] tabular-nums block mt-0.5">
                        {toTime(art.publishedAt)}
                      </span>
                    </div>
                    {/* Dot */}
                    <div className="shrink-0 w-2 h-2 rounded-full bg-[#C8102E] mt-1.5 relative z-10 ring-2 ring-white" />
                    {/* Título */}
                    <div className="flex-1 min-w-0">
                      <CategoryBadge category={art.category} className="mb-0.5 block" />
                      <h3 className="text-[0.78rem] font-bold leading-snug group-hover:text-[#C8102E] transition-colors line-clamp-2 text-[#111111]">
                        {art.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <Link href="/categoria/internacional" className="mt-5 flex items-center gap-1 text-[0.5rem] font-bold uppercase tracking-[0.2em] text-[#C8102E] hover:underline transition-all">
              Ver más actualizaciones →
            </Link>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BLOQUE 3 — LO MÁS LEÍDO HOY (5 cards horizontales)
        ══════════════════════════════════════════════════════════════════ */}
        <div className="py-10 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3 pb-3 mb-8 border-b-[2px] border-[#111111]">
            <span className="w-2.5 h-2.5 bg-[#C8102E] rounded-full" />
            <span className="text-[0.6rem] font-black uppercase tracking-[0.35em]">Lo más leído hoy</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Fix O-3: slice(1,6) evita repetir pool[0] que ya es el artículo hero */}
            {pool.slice(1, 6).map((art, idx) => (
              <Link key={art.id} href={`/articulo/${art.slug}`} className="group block">
                <div className="relative mb-3 overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-sm">
                  <PremiumImage
                    src={art.image}
                    alt={art.title}
                    category={art.category}
                    containerClassName="aspect-[16/10] w-full"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                    width={380}
                  />
                </div>
                <CategoryBadge category={art.category} className="mb-1.5 block" />
                <h3 className="text-[0.8rem] font-bold leading-snug tracking-tight text-[#111111] group-hover:text-[#C8102E] transition-colors line-clamp-3 mb-1.5">
                  {art.title}
                </h3>
                <span className="text-[0.47rem] text-[#AAAAAA] font-semibold uppercase tracking-widest">{formatDate(art.publishedAt)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            BLOQUE 4 — MÁS NOTICIAS (3 cols) + AD 300×600
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12 py-10">

          {/* Grid artículos */}
          <div>
            <div className="flex items-center gap-2 pb-3 mb-8 border-b-[2px] border-[#111111]">
              <span className="w-2 h-2 bg-[#C8102E] rounded-full" />
              <span className="text-[0.6rem] font-black uppercase tracking-[0.35em]">Más Noticias</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pool.slice(13, 19).map((art) => (
                <Link key={art.id} href={`/articulo/${art.slug}`} className="group block border-b border-[#E5E5E5] pb-7">
                  {art.image && (
                    <div className="overflow-hidden mb-4 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
                      <PremiumImage
                        src={art.image}
                        alt={art.title}
                        category={art.category}
                        containerClassName="aspect-[16/9] w-full"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        width={480}
                      />
                    </div>
                  )}
                  <CategoryBadge category={art.category} className="mb-2 block" />
                  <h3 className="card-title text-[0.95rem] leading-snug text-[#111111] group-hover:text-[#C8102E] transition-colors line-clamp-3 mb-2.5">
                    {art.title}
                  </h3>
                  {art.excerpt && (
                    <p className="text-[0.75rem] text-[#666666] line-clamp-2 leading-relaxed mb-3 font-serif">{art.excerpt}</p>
                  )}
                  <span className="text-[0.47rem] text-[#AAAAAA] font-semibold uppercase tracking-widest">{formatDate(art.publishedAt)}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* AD 300×600 sticky */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <AdUnit format="rectangle" slot="home_sidebar_bottom" />
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}