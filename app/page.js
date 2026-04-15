// app/page.js — Portada Imperio Público — Diseño Periódico Clásico
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedArticles, getLatestArticles, getArticlesByCategory } from '@/lib/serverData';
import NewsletterBox from '@/components/NewsletterBox';

export const dynamic = 'force-dynamic';
export const revalidate = 60;



export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    getFeaturedArticles(6),
    getLatestArticles(30),
  ]);

  // Distribute articles
  const pool = featured.length >= 6 ? featured : [...featured, ...latest].filter(
    (a, i, arr) => arr.findIndex(x => x.id === a.id) === i
  );

  const hero   = pool[0] || null;
  const col2   = pool.slice(1, 3);   // 2 artículos columna central
  const col3   = pool.slice(3, 7);   // 4 artículos columna derecha (Últimas Noticias)
  const usedIds = new Set(pool.slice(0, 7).map(a => a.id));
  const ticker  = latest.filter(a => !usedIds.has(a.id)).slice(0, 6); // Últimas noticias bajo portada

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#111827', fontFamily: 'Georgia, serif' }}>

      {/* ══════════════════════════════════════════════
          PORTADA — Diseño Periódico Clásico
      ══════════════════════════════════════════════ */}
      <main aria-label="Portada">

        {/* ── Línea superior roja ── */}
        <div style={{ height: '4px', backgroundColor: '#bb1b21' }} />

        {/* ── Fecha del día ── */}
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }} className="py-2 px-4 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <time style={{ fontSize: '0.7rem', color: '#6b7280', fontFamily: 'Inter, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </time>
            <span style={{ fontSize: '0.7rem', color: '#bb1b21', fontFamily: 'Inter, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Edición Digital
            </span>
          </div>
        </div>

        {/* ── CUERPO DE LA PORTADA — 3 columnas de periódico ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

            {/* ══ COLUMNA 1 — Historia Principal (6 cols) ══ */}
            <div style={{ borderRight: '1px solid #d1d5db' }} className="lg:col-span-6 lg:pr-8 pb-8 lg:pb-0">
              {hero && (
                <Link href={`/articulo/${hero.slug}`} className="group block">
                  {/* Etiqueta categoría */}
                  <div style={{ borderBottom: '3px solid #bb1b21', marginBottom: '1rem', paddingBottom: '0.4rem' }}>
                    <span style={{ color: '#bb1b21', fontSize: '0.65rem', fontFamily: 'Inter, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em' }}>
                      {hero.category?.toUpperCase() || 'PORTADA'}
                    </span>
                  </div>

                  {/* Titular grande */}
                  <h1 style={{
                    fontSize: 'clamp(1.6rem, 3vw, 2.75rem)',
                    fontWeight: 700,
                    lineHeight: 1.2,
                    letterSpacing: '-0.02em',
                    color: '#0f0f0f',
                    marginBottom: '1rem',
                    fontFamily: 'Lora, Georgia, serif',
                  }}
                    className="group-hover:text-red-700 transition-colors"
                  >
                    {hero.title}
                  </h1>

                  {/* Imagen principal */}
                  {hero.image && (
                    <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', marginBottom: '1rem', backgroundColor: '#f3f4f6' }}>
                      <Image
                        src={hero.image}
                        alt={hero.imageAlt || hero.title}
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  )}

                  {/* Epígrafe / bajada */}
                  {hero.excerpt && (
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.65, color: '#374151', fontStyle: 'italic', marginBottom: '0.75rem', borderLeft: '4px solid #e5e7eb', paddingLeft: '1rem' }}>
                      {hero.excerpt}
                    </p>
                  )}

                  {/* Firma */}
                  <p style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Por {hero.author} · {formatDate(hero.publishedAt)}
                  </p>
                </Link>
              )}
            </div>

            {/* ══ COLUMNA 2 — Dos artículos (Cuadros 3 y 4) (3 cols) ══ */}
            <div style={{ borderRight: '1px solid #d1d5db' }} className="lg:col-span-3 lg:px-6 py-6 lg:py-0 space-y-8">
              {col2.map((art, i) => (
                <div key={art.id} style={i < col2.length - 1 ? { borderBottom: '1px solid #e5e7eb', paddingBottom: '2rem' } : {}}>
                  <Link href={`/articulo/${art.slug}`} className="group block">
                    <span style={{ color: '#bb1b21', fontSize: '0.6rem', fontFamily: 'Inter, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', display: 'block', marginBottom: '0.5rem' }}>
                      {art.category?.toUpperCase()}
                    </span>
                    {art.image && (
                      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', marginBottom: '0.75rem', backgroundColor: '#f3f4f6' }}>
                        <Image src={art.image} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.15, color: '#111827', marginBottom: '0.5rem', fontFamily: 'Georgia, serif' }}
                      className="group-hover:text-red-700 transition-colors"
                    >
                      {art.title}
                    </h2>
                    {art.excerpt && (
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.55, fontStyle: 'italic' }} className="line-clamp-3">
                        {art.excerpt}
                      </p>
                    )}
                    <p style={{ fontSize: '0.65rem', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.5rem' }}>
                      {formatDate(art.publishedAt)}
                    </p>
                  </Link>
                </div>
              ))}
            </div>


            {/* ══ COLUMNA 3 — Breves y AdSense (3 cols) ══ */}
            <div className="lg:col-span-3 lg:pl-6 py-6 lg:py-0 space-y-6">
              
              {/* Parte Superior: Últimas Noticias */}
              <div style={{ borderBottom: '3px solid #111827', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.65rem', fontFamily: 'Inter, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#111827' }}>
                  Últimas Noticias
                </span>
              </div>
              {col3.map((art, i) => (
                <div key={art.id} style={i < col3.length - 1 ? { borderBottom: '1px solid #e5e7eb', paddingBottom: '1.25rem' } : {}}>
                  <Link href={`/articulo/${art.slug}`} className="group flex gap-3 items-start">
                    {art.image && (
                      <div style={{ position: 'relative', width: '80px', height: '60px', flexShrink: 0, overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                        <Image src={art.image} alt={art.title} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span style={{ color: '#bb1b21', fontSize: '0.58rem', fontFamily: 'Inter, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.25rem' }}>
                        {art.category?.toUpperCase()}
                      </span>
                      <h3 style={{ fontSize: '0.9rem', fontWeight: 900, lineHeight: 1.2, color: '#111827', fontFamily: 'Georgia, serif' }}
                        className="group-hover:text-red-700 transition-colors line-clamp-3"
                      >
                        {art.title}
                      </h3>
                    </div>
                  </Link>
                </div>
              ))}

              {/* Parte Inferior: Cuadro 0 - Espacio AdSense */}
              <div style={{ borderTop: '2px solid #111827', paddingTop: '1.5rem', marginTop: '2rem' }} className="flex justify-center">
                 <div className="h-[350px] w-full bg-slate-50 border border-dashed border-gray-300 flex flex-col items-center justify-center p-6 text-center">
                    <svg className="w-8 h-8 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Espacio Publicitario Reservado</p>
                    <p className="text-xs text-slate-500 italic max-w-[150px]">Google AdSense</p>
                 </div>
              </div>
            </div>

          </div>{/* /grid portada */}
        </div>

        {/* ── Línea separadora inferior ── */}
        <div style={{ height: '3px', backgroundColor: '#111827' }} className="max-w-7xl mx-auto" />

      </main>



      {/* ══════════════════════════════════════════════
          ÚLTIMAS — Franja de artículos recientes
      ══════════════════════════════════════════════ */}
      {ticker.length > 0 && (
        <section aria-label="Artículos recientes" style={{ backgroundColor: '#ffffff' }} className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-6">

            <div className="flex items-center gap-4 mb-8">
              <div style={{ height: '3px', width: '2rem', backgroundColor: '#bb1b21' }} />
              <h2 style={{ fontSize: '0.7rem', fontFamily: 'Inter, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.4em', color: '#111827' }}>
                Lo más Reciente
              </h2>
              <div style={{ height: '1px', flex: 1, backgroundColor: '#d1d5db' }} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {ticker.map(art => (
                <Link key={art.id} href={`/articulo/${art.slug}`} className="group block">
                  <article>
                    {art.image && (
                      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', marginBottom: '0.75rem', backgroundColor: '#f3f4f6' }}>
                        <Image src={art.image} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <span style={{ color: '#bb1b21', fontSize: '0.58rem', fontFamily: 'Inter, sans-serif', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', display: 'block', marginBottom: '0.3rem' }}>
                      {art.category}
                    </span>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 900, lineHeight: 1.25, color: '#111827', fontFamily: 'Georgia, serif' }}
                      className="group-hover:text-red-700 transition-colors line-clamp-3"
                    >
                      {art.title}
                    </h3>
                    <p style={{ fontSize: '0.62rem', color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 700, marginTop: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {formatDate(art.publishedAt)}
                    </p>
                  </article>
                </Link>
              ))}
            </div>

          </div>
        </section>
      )}

      {/* Newsletter */}
      <section style={{ backgroundColor: '#111827' }} className="py-16">
        <NewsletterBox />
      </section>

    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
}
