// app/page.js — Portada de Imperio Público 2.0 (Diseño Premium Moderno)
import Link from 'next/link';
import { getFeaturedArticles, getLatestArticles, getArticlesByCategory } from '@/lib/serverData';
import { CATEGORIES } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidar cada minuto

export default async function HomePage() {
  const featured = await getFeaturedArticles(4);
  const latest = await getLatestArticles(15);
  const sports = await getArticlesByCategory('deportes', 4);
  const entertainment = await getArticlesByCategory('entretenimiento', 4);
  const tech = await getArticlesByCategory('tecnologia', 4);
  const opinions = await getArticlesByCategory('opinion', 4);
  
  // Logical Distribution
  let heroArticle = null;
  let sideFeatured = [];
  let remainingLatest = [];

  if (featured.length > 0) {
    heroArticle = featured[0];
    sideFeatured = featured.slice(1, 4);
    const featuredIds = featured.map(a => a.id);
    remainingLatest = latest.filter(a => !featuredIds.includes(a.id));
  } else {
    heroArticle = latest[0];
    sideFeatured = latest.slice(1, 4);
    remainingLatest = latest.slice(4);
  }

  const latestGrid = remainingLatest.slice(0, 6);
  const isJustIn = heroArticle?.id === latest[0]?.id;

  return (
    <div className="bg-white">
      {/* ── Breaking Ticker (Minimalist) ── */}
      <div className="border-b border-gray-100 bg-gray-50/50 py-3 mb-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 whitespace-nowrap">Último Minuto</span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap text-[12px] font-bold text-slate-600 uppercase tracking-tight">
              {latest.slice(0, 3).map((a, i) => (
                <Link key={a.id} href={`/articulo/${a.slug}`} className="hover:text-black mx-6 transition-colors">
                   {a.title} {i < 2 ? ' — ' : ''}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero Section (1 Large + 3 Small) ── */}
      <section className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20">
          <div className="lg:col-span-8">
            <ArticleCard 
              article={heroArticle} 
              variant="hero" 
              extraBadge={isJustIn ? "LO ÚLTIMO" : null}
            />
          </div>
          <div className="lg:col-span-4 border-l border-gray-100 pl-0 lg:pl-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8 pb-3 border-b border-gray-100 italic">Destacados</h2>
            <div className="flex flex-col gap-2">
               {sideFeatured.map(a => (
                 <ArticleCard key={a.id} article={a} variant="small" />
               ))}
            </div>
            <div className="mt-12 bg-slate-50 p-8 border-t-4 border-red-600">
               <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Resumen Imperial</h3>
               <p className="text-xs text-slate-500 font-serif leading-relaxed mb-6">Recibe las noticias con autoridad cada mañana directamente en tu correo.</p>
               <div className="flex flex-col gap-2">
                  <input type="email" placeholder="Correo electrónico" className="w-full px-4 py-3 bg-white border border-gray-200 focus:outline-none focus:border-red-600 text-xs font-bold" />
                  <button className="bg-black text-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-colors">Suscribirse</button>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Latest News Grid ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-gray-100 mb-20">
         <div className="flex items-center justify-between mb-12">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter italic">Lo Reciente</h2>
            <Link href="/categoria/noticias" className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 hover:underline">Ver todo</Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {latestGrid.map(a => (
              <ArticleCard key={a.id} article={a} variant="medium" />
            ))}
         </div>
      </section>

      {/* ── Category Focus: Entretenimiento (Vibrant/Chic) ── */}
      {entertainment.length > 0 && (
         <section className="bg-slate-50 py-24 mb-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                   <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 block mb-2">Cultura Pop</span>
                      <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">Entretenimiento</h2>
                   </div>
                   <Link href="/categoria/entretenimiento" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-red-600 bg-white px-6 py-3 border border-gray-100">Explorar Más</Link>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <ArticleCard article={entertainment[0]} variant="wide" />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {entertainment.slice(1, 3).map(a => (
                        <ArticleCard key={a.id} article={a} variant="medium" className="bg-white p-6 shadow-sm border-0" />
                      ))}
                   </div>
                </div>
            </div>
         </section>
      )}

      {/* ── Category Focus: Deportes (Institutional Dark Section) ── */}
      <section className="bg-black text-white py-24 mb-20 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-6 mb-16">
             <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white/10 select-none absolute -top-10 left-0">DEPORTES</h2>
             <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white relative z-10 italic">Adrenalina Pura</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
             {sports.map(a => (
               <Link key={a.id} href={`/articulo/${a.slug}`} className="group block h-full">
                  <article className="h-full flex flex-col">
                     <div className="relative aspect-[16/9] mb-4 overflow-hidden bg-white/5">
                        <img src={a.image} alt={a.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                     </div>
                     <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-red-500 transition-colors leading-tight">{a.title}</h3>
                     <p className="text-[10px] uppercase font-black text-white/40 mt-4 tracking-widest">{formatDate(a.publishedAt)}</p>
                  </article>
               </Link>
             ))}
          </div>
        </div>
      </section>

      {/* ── Category Focus: Tecnología (Bento Modern) ── */}
      {tech.length > 0 && (
         <section className="max-w-7xl mx-auto px-6 py-24 mb-20">
            <div className="flex items-center gap-4 mb-16">
                <div className="h-px bg-slate-200 flex-1"></div>
                <h2 className="text-2xl font-black uppercase tracking-[0.4em] text-slate-800">Tecnología</h2>
                <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="md:col-span-2">
                  <ArticleCard article={tech[0]} variant="wide" />
               </div>
               <div className="flex flex-col gap-8">
                  {tech.slice(1, 3).map(a => (
                    <ArticleCard key={a.id} article={a} variant="small" />
                  ))}
               </div>
            </div>
         </section>
      )}

      {/* ── Opinion Section (Editorial Premium) ── */}
      <section className="bg-slate-50 border-y border-gray-100 py-32 mb-20">
         <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-20">
               <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 block mb-4">Columnas & Perspectivas</span>
               <h2 className="text-5xl md:text-7xl font-serif italic text-black">Voces de Autoridad</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               {(opinions.length > 0 ? opinions : latest.slice(8, 12)).map(a => (
                 <ArticleCard key={a.id} article={a} variant="editorial" />
               ))}
            </div>
         </div>
      </section>

      <div className="text-center py-20 mb-20">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-6">La Autoridad de la Actualidad</p>
         <Link href="/categoria/noticias" className="inline-block bg-black text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-colors">Volver a empezar</Link>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}
