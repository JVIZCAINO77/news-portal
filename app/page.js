// app/page.js — Portada Imperio Público — Diseño Periódico Clásico
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedArticles, getLatestArticles, getArticlesByCategory } from '@/lib/serverData';
import { SITE_CONFIG } from '@/lib/data';
import NewsletterBox from '@/components/NewsletterBox';
import AdUnit from '@/components/AdUnit';
import LoadMore from '@/components/LoadMore';

export const dynamic = 'force-dynamic';
export const revalidate = 60;



export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    getFeaturedArticles(6),
    getLatestArticles(30),
  ]);

  const pool = featured.length >= 12 ? featured : [...featured, ...latest].filter(
    (a, i, arr) => arr.findIndex(x => x.id === a.id) === i
  );

  // Mark all articles used in the above sections as unique
  const usedIds = new Set(pool.slice(0, 12).map(a => a.id));
  const ticker  = latest.filter(a => !usedIds.has(a.id)).slice(0, 6); // Remaining for "Lo más reciente" grid

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#111827', fontFamily: 'Georgia, serif' }}>

      {/* ══════════════════════════════════════════════
          PORTADA — Diseño Periódico Clásico
      ══════════════════════════════════════════════ */}
      <main aria-label="Portada">

        {/* ── Línea superior roja ── */}
        <div style={{ height: '4px', backgroundColor: '#bb1b21' }} />

        {/* ── Espacio Publicitario Superior ── */}
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <AdUnit format="leaderboard" slot="home-top" className="!my-0" />
        </div>


        {/* ── SECCIÓN 1: Jerarquía de Impacto (Especial + Sidebar) ── */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-6 border-b-4 border-black mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Artículo Especial (Importancia 1) - 2/3 de ancho */}
            <div className="lg:col-span-8 border-b lg:border-b-0 lg:border-r border-gray-100 pb-12 lg:pb-0 lg:pr-12">
              {pool[0] && (
                <Link href={`/articulo/${pool[0].slug}`} className="group block">
                  <h2 style={{ 
                    fontSize: 'clamp(1.6rem, 3.5vw, 3rem)', 
                    fontWeight: 900, 
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    marginBottom: '1rem',
                    marginTop: '0'
                  }} className="font-serif text-[#0f0f0f] group-hover:text-red-700 transition-colors">
                    {pool[0].title}
                  </h2>
                  {pool[0].image && (
                    <div className="relative aspect-[16/9] overflow-hidden mb-8 bg-slate-50 shadow-sm">
                      <Image src={pool[0].image} alt={pool[0].title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" priority />
                    </div>
                  )}
                  <p className="text-xl md:text-2xl leading-relaxed text-gray-700 font-serif line-clamp-3 italic mb-8">
                    {pool[0].excerpt}
                  </p>
                  <p className="text-[0.7rem] font-black text-gray-400 uppercase tracking-[0.2em] pt-6 border-t border-gray-50">
                    EDICIÓN ESPECIAL · POR {pool[0].author.toUpperCase()} · {formatDate(pool[0].publishedAt)}
                  </p>
                </Link>
              )}
            </div>

            {/* Sidebar de Noticias (Importancia 2 y 3) - 1/3 de ancho */}
            <div className="lg:col-span-4 flex flex-col gap-10">
              {pool.slice(1, 3).map((art, idx) => (
                <div key={art.id} className={idx === 0 ? 'pb-10 border-b border-gray-100' : ''}>
                  <Link href={`/articulo/${art.slug}`} className="group block">
                    {art.image && (
                      <div className="relative aspect-[16/9] overflow-hidden mb-5 bg-slate-50">
                        <Image src={art.image} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                    <h3 className="text-xl md:text-2xl font-black font-serif text-[#0f0f0f] group-hover:text-red-700 leading-tight mb-3">
                      {art.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 italic mb-4 text-serif">
                      {art.excerpt}
                    </p>
                    <span className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-widest">
                       {formatDate(art.publishedAt)}
                    </span>
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── SECCIÓN 2: Historias 4 y 5 + Columna a la Derecha (Sidebar) ── */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Izquierda: 2 noticias principales secundarias */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-12 border-r border-gray-100 pr-0 lg:pr-12">
              {pool.slice(3, 5).map((art) => (
                <div key={art.id}>
                  <Link href={`/articulo/${art.slug}`} className="group block">
                    {art.image && (
                      <div className="relative aspect-[16/9] overflow-hidden mb-5 bg-slate-50 text-center">
                        <Image src={art.image} alt={art.title} fill className="object-cover" />
                      </div>
                    )}
                    <span className="text-[0.6rem] font-black text-[#bb1b21] uppercase tracking-[0.2em] mb-3 block">
                      {art.category}
                    </span>
                    <h3 className="text-xl md:text-2xl font-black font-serif text-[#0f0f0f] group-hover:text-red-700 leading-tight mb-4">
                      {art.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3 italic">
                      {art.excerpt}
                    </p>
                  </Link>
                </div>
              ))}
            </div>

            {/* Derecha: Sidebar Editorial (Breves + Publicidad) */}
            <div className="lg:col-span-4">
              <div className="border-b-2 border-black mb-6 pb-2">
                <span className="text-[0.7rem] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                  Breves del Imperio
                </span>
              </div>

              <AdUnit format="rectangle" slot="home-sidebar-top" className="my-0 mb-10" />
              <div className="space-y-8">
                {pool.slice(8, 12).map((art, idx) => (
                  <Link key={art.id} href={`/articulo/${art.slug}`} className="group flex gap-5 items-start border-b border-gray-50 pb-6 last:border-0">
                    <div className="text-3xl font-black text-slate-100 font-serif leading-none">{idx + 1}</div>
                    <div className="flex-1">
                      <h4 className="text-[0.95rem] font-black font-serif group-hover:text-red-700 leading-snug">
                        {art.title}
                      </h4>
                      <span className="text-[0.55rem] text-[#bb1b21] font-bold uppercase tracking-widest mt-2 block">
                        {art.category}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECCIÓN 3: Cintillo de texto + Lo más Reciente ── */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 border-t-2 border-slate-100">
          
          {/* Fila superior: Texto breve horizontal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 pb-8 border-b border-gray-100">
             {pool.slice(5, 8).map(art => (
               <Link key={art.id} href={`/articulo/${art.slug}`} className="group block border-l-2 border-red-600 pl-4 hover:bg-slate-50 transition-colors py-2">
                  {art.image && (
                    <div className="relative aspect-[16/9] overflow-hidden mb-3 bg-slate-50">
                      <Image src={art.image} alt={art.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  )}
                  <h4 className="text-sm font-black font-serif group-hover:text-red-700 leading-tight mb-1">{art.title}</h4>
                  <p className="text-[0.6rem] text-gray-400 font-sans uppercase font-bold">{formatDate(art.publishedAt)}</p>
               </Link>
             ))}
          </div>

          {/* Fila inferior: Lo más reciente con imágenes */}
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-[0.7rem] font-sans font-black uppercase tracking-[0.4em] text-gray-900">Lo más Reciente</h2>
            <div className="h-px flex-1 bg-gray-100"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {ticker.map(art => (
              <Link key={art.id} href={`/articulo/${art.slug}`} className="group block">
                <article>
                  {art.image && (
                    <div className="relative aspect-[16/9] overflow-hidden mb-3 bg-slate-50">
                      <Image src={art.image} alt={art.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                  <span className="text-[0.58rem] font-black text-[#bb1b21] uppercase tracking-[0.1em] mb-1 block">
                    {art.category}
                  </span>
                  <h3 className="text-[0.85rem] font-black leading-snug font-serif text-[#111827] group-hover:text-red-700 transition-colors line-clamp-3">
                    {art.title}
                  </h3>
                  <p className="text-[0.6rem] text-gray-400 font-bold mt-2 uppercase">{formatDate(art.publishedAt)}</p>
                </article>
              </Link>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 md:px-8 mt-16">
          <LoadMore initialOffset={30} />
        </div>

      </main>

      {/* ── Espacio Publicitario Inferior ── */}
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <AdUnit format="leaderboard" slot="home-bottom" />
      </div>

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
