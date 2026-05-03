// app/page.js — Portada Imperio Público — Diseño Periódico Clásico
import Link from 'next/link';
import { getDailyTopArticles, getLatestArticles } from '@/lib/serverData';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';
import PremiumImage from '@/components/PremiumImage';
import NewsletterBox from '@/components/NewsletterBox';
import AdUnit from '@/components/AdUnit';
import BreakingTicker from '@/components/BreakingTicker';

export const revalidate = 60; // Cachear por 1 minuto para carga instantánea, revalidando en background



export default async function HomePage() {
  // Cargamos en paralelo: top del día (por impacto) + últimas noticias (para el ticker)
  const [dailyTop, latest] = await Promise.all([
    getDailyTopArticles(12, 6),
    getLatestArticles(30),
  ]);

  const clean = (str) => typeof str === 'string' ? str.replace(/#+\s*/g, '').trim() : str;
  const sanitize = (art) => ({
    ...art,
    title: clean(art.title),
    excerpt: clean(art.excerpt)
  });

  const cleanedTop    = dailyTop.map(sanitize);
  const cleanedLatest = latest.map(sanitize);

  // Pool principal: artículos de mayor impacto del día, completado con los más recientes si hace falta
  const pool = cleanedTop.length >= 12
    ? cleanedTop
    : [...cleanedTop, ...cleanedLatest].filter(
        (a, i, arr) => arr.findIndex(x => x.id === a.id) === i
      );

  // El ticker muestra las noticias recientes que NO están ya en el pool principal
  const usedIds = new Set(pool.slice(0, 12).map(a => a.id));
  const ticker  = cleanedLatest.filter(a => !usedIds.has(a.id)).slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_CONFIG.name,
    "url": SITE_CONFIG.url,
    "logo": `${SITE_CONFIG.url}${SITE_CONFIG.logo}`,
    "sameAs": [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
      SITE_CONFIG.social.twitter,
      SITE_CONFIG.social.youtube
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-829-637-1008",
      "contactType": "customer service",
      "areaServed": "DO",
      "availableLanguage": "Spanish"
    }
  };

  return (
    <div className="bg-white text-gray-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ══════════════════════════════════════════════
          PORTADA — Diseño Periódico Clásico
      ══════════════════════════════════════════════ */}
      <main aria-label="Portada">
        {/* Espacio en blanco (Ticker eliminado a petición) */}
        <div className="h-4 md:h-6" />

        {/* ── SECCIÓN 1: Jerarquía de Impacto (Especial + Sidebar) ── */}

        <div className="max-w-6xl mx-auto px-4 md:px-8 pb-4 border-b border-black mb-6 mt-[7px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Artículo Especial (Importancia 1) - 2/3 de ancho */}
            <div className="lg:col-span-8 border-b lg:border-b-0 lg:border-r border-gray-100 pb-12 lg:pb-0 lg:pr-12">
              {pool[0] && (
                <Link href={`/articulo/${pool[0].slug}`} className="group block">
                  {/* PARTE 1: TÍTULO EN LA SECCIÓN ROJA */}
                  <h1 className="editorial-title group-hover:text-red-700 transition-colors mb-4 text-4xl md:text-5xl lg:text-7xl">
                    {(pool[0].title && pool[0].title.trim() !== '') ? pool[0].title : 'Información en Desarrollo'}
                  </h1>

                  {/* PARTE 2: IMAGEN */}
                  {pool[0].image && (
                    <PremiumImage 
                      src={pool[0].image} 
                      alt={pool[0].title}
                      category={pool[0].category}
                      containerClassName="w-full min-h-[350px] md:min-h-[500px] max-h-[650px] mb-[16px] shadow-xl border border-gray-100 rounded-sm group/img"
                      className="w-auto h-auto max-w-full max-h-[650px] object-contain transition-transform duration-700 group-hover/img:scale-[1.01] shadow-2xl"
                      priority={true}
                    />
                  )}
                  
                  {/* PARTE 3: SUBTÍTULO EN LA SECCIÓN VERDE (El amarillo fue eliminado) */}
                  {(pool[0].excerpt && pool[0].excerpt.trim() !== '') && (
                    <p className="text-xl md:text-2xl leading-relaxed font-serif line-clamp-3 text-gray-800 mb-[4px]">
                      {pool[0].excerpt}
                    </p>
                  )}

                  <p className="text-[0.7rem] font-black text-gray-600 uppercase tracking-[0.2em] pt-6 border-t border-gray-50">
                   EDICIÓN ESPECIAL · POR {(pool[0].author || 'Redacción').toUpperCase()} · {formatDate(pool[0].publishedAt)}
                  </p>
                </Link>
              )}
            </div>


            {/* Sidebar de Noticias (Importancia 2 y 3) - 1/3 de ancho */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {pool.slice(1, 3).map((art, idx) => (
                <div key={art.id} className={idx === 0 ? 'pb-10 border-b border-gray-100' : ''}>
                  <Link href={`/articulo/${art.slug}`} className="group block">
                    {art.image && (
                      <PremiumImage 
                        src={art.image} 
                        alt={art.title}
                        category={art.category}
                        containerClassName="aspect-[16/9] mb-5 shadow-md rounded-sm group/img"
                        className="w-auto h-auto max-w-full max-h-full object-contain transition-transform duration-500 group-hover/img:scale-105"
                        width={600}
                        priority={true}
                      />
                    )}
                    <h2 className="card-title text-xl md:text-2xl group-hover:text-red-700 leading-tight mb-3">
                      {(art.title && art.title.trim() !== '') ? art.title : 'Información en Desarrollo'}
                    </h2>
                    {(art.excerpt && art.excerpt.trim() !== '') && (
                      <p className="text-sm line-clamp-2 mb-4 text-serif text-gray-700">
                        {art.excerpt}
                      </p>
                    )}
                    <span className="text-[0.6rem] font-bold text-gray-600 uppercase tracking-widest">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Izquierda: 2 noticias principales secundarias */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-r border-gray-100 pr-0 lg:pr-8">
              {pool.slice(3, 5).map((art) => (
                <div key={art.id}>
                  <Link href={`/articulo/${art.slug}`} className="group block">
                    {art.image && (
                      <PremiumImage 
                        src={art.image} 
                        alt={art.title}
                        category={art.category}
                        containerClassName="aspect-[16/9] mb-5 shadow-md rounded-sm group/img"
                        className="w-auto h-auto max-w-full max-h-full object-contain transition-transform duration-500 group-hover/img:scale-105"
                      />
                    )}
                    {art.category?.toLowerCase() !== 'noticias' && (
                      <span className="text-[0.6rem] font-black text-[#bb1b21] uppercase tracking-[0.2em] mb-3 block">
                        {art.category}
                      </span>
                    )}
                    <h2 className="card-title text-xl md:text-2xl group-hover:text-red-700 leading-tight mb-4">
                      {(art.title && art.title.trim() !== '') ? art.title : 'Información en Desarrollo'}
                    </h2>
                    {(art.excerpt && art.excerpt.trim() !== '') && (
                      <p className="text-sm line-clamp-3 text-gray-700">
                        {art.excerpt}
                      </p>
                    )}
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

              <AdUnit format="rectangle" slot="home_sidebar" className="my-0 mb-10" />
              <div className="space-y-8">
                {pool.slice(8, 12).map((art, idx) => (
                  <Link key={art.id} href={`/articulo/${art.slug}`} className="group flex gap-5 items-start border-b border-gray-100 pb-6 last:border-0">
                    <div className="text-3xl font-black text-gray-200 font-serif leading-none shrink-0">{idx + 1}</div>
                    <div className="flex-1">
                      <h3 className="text-[0.95rem] font-bold group-hover:text-red-700 leading-snug">
                        {(art.title && art.title.trim() !== '') ? art.title : 'Información en Desarrollo'}
                      </h3>
                      {art.category?.toLowerCase() !== 'noticias' && (
                        <span className="text-[0.55rem] text-[#bb1b21] font-bold uppercase tracking-widest mt-2 block">
                          {art.category}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Newsletter - Full Width */}
      <NewsletterBox />

      <section style={{ backgroundColor: '#111827' }}>
         {/* Espacio reservado para pie de página o créditos adicionales */}
      </section>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
}
