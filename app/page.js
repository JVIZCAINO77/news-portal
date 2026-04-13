// app/page.js — Portada de Imperio Público 2.0 (Diseño Premium Moderno)
import Link from 'next/link';
import { getFeaturedArticles, getLatestArticles, getArticlesByCategory } from '@/lib/serverData';
import { CATEGORIES } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import NewsletterBox from '@/components/NewsletterBox';

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
      {/* ── Master Entry: The Golden Grid (1 Large + 2 Medium + Sidebar) ── */}
      <section className="max-w-7xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Main Hero Column (6/12) */}
          <div className="lg:col-span-7">
             <ArticleCard 
               article={heroArticle} 
               variant="hero" 
               extraBadge={isJustIn ? "LO ÚLTIMO" : null}
             />
          </div>

          {/* Secondary Features Column (3/12) */}
          <div className="lg:col-span-3 border-x border-gray-100 px-0 lg:px-8 space-y-10">
             <div className="pb-8 border-b border-gray-100">
                <ArticleCard article={sideFeatured[0]} variant="medium" className="border-0 pb-0" />
             </div>
             <div className="pb-8 border-b border-gray-100">
                <ArticleCard article={sideFeatured[1]} variant="medium" className="border-0 pb-0" />
             </div>
             <div>
                <ArticleCard article={sideFeatured[2]} variant="medium" className="border-0 pb-0" />
             </div>
          </div>

          {/* Live / Most Read Sidebar (2/12) */}
          <div className="lg:col-span-2 space-y-10">
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-6 pb-2 border-b-2 border-red-600 inline-block italic">En Directo</h4>
                <div className="space-y-4">
                   {latest.slice(5, 10).map(a => (
                      <ArticleCard key={a.id} article={a} variant="minimal" className="py-0 border-0" />
                   ))}
                </div>
             </div>
             
             <div className="pt-8 border-t border-gray-100">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-6 pb-2 border-b border-gray-100 italic">Lo más leído</h4>
                <div className="space-y-4">
                   {latest.slice(10, 14).map((a, i) => (
                      <Link key={a.id} href={`/articulo/${a.slug}`} className="group flex gap-3 items-start">
                         <span className="text-2xl font-black text-slate-100 group-hover:text-red-600 transition-colors leading-none">{i + 1}</span>
                         <h5 className="text-[10px] font-black uppercase tracking-tight leading-tight group-hover:underline">{a.title}</h5>
                      </Link>
                   ))}
                </div>
             </div>

             {/* Optimized Newsletter Block (Sidebar Variant) */}
             <div className="pt-8 border-t border-gray-100">
                <NewsletterBox variant="compact" />
             </div>
          </div>

        </div>
      </section>

      {/* ── Latest News Row ── */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-gray-100 mb-12">
         <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">Últimas Crónicas</h2>
            <Link href="/categoria/noticias" className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 hover:text-black border-b border-red-600 pb-1 flex items-center gap-2">
               Secciones <span className="text-lg">→</span>
            </Link>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
            {latestGrid.map(a => (
              <ArticleCard key={a.id} article={a} variant="medium" />
            ))}
         </div>
      </section>

      {/* ── Category Focus: Deportes (Institutional Dark Section) ── */}
      <section className="bg-black text-white py-20 mb-12 overflow-hidden relative border-y border-white/10">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-6 mb-12">
             <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white relative z-10 italic">Adrenalina Pura</h2>
             <span className="h-px bg-white/20 flex-1"></span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
             {sports.map(a => (
               <Link key={a.id} href={`/articulo/${a.slug}`} className="group block h-full">
                  <article className="h-full flex flex-col">
                     <div className="relative aspect-[16/9] mb-6 overflow-hidden bg-white/5 border border-white/5">
                        <img src={a.image} alt={a.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                     </div>
                     <h3 className="text-xl font-bold uppercase tracking-tight group-hover:text-red-500 transition-colors leading-tight">{a.title}</h3>
                     <p className="text-[10px] uppercase font-black text-white/40 mt-6 tracking-widest">{formatDate(a.publishedAt)}</p>
                  </article>
               </Link>
             ))}
          </div>
        </div>
      </section>

      {/* ── Category Focus: Tecnología (Bento Modern) ── */}
      {tech.length > 0 && (
         <section className="max-w-7xl mx-auto px-6 py-16 mb-12">
            <div className="newspaper-divider !mt-0 !mb-8">
                <h2 className="text-2xl font-black uppercase tracking-[0.6em] text-slate-800 bg-white px-8 italic">Futuro & Tech</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
               <div className="lg:col-span-8">
                  <ArticleCard article={tech[0]} variant="wide" className="shadow-2xl shadow-slate-200/50" />
               </div>
               <div className="lg:col-span-4 flex flex-col gap-10">
                  {tech.slice(1, 3).map(a => (
                    <ArticleCard key={a.id} article={a} variant="small" />
                  ))}
               </div>
            </div>
         </section>
      )}

      {/* ── Category Focus: Entretenimiento (Ordered & Chic) ── */}
      {entertainment.length > 0 && (
         <section className="bg-slate-50 border-y border-gray-100 py-20 mb-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                   <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 block mb-3 italic">Lo más sonado</span>
                      <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none border-l-8 border-red-600 pl-8">Escena</h2>
                   </div>
                   <Link href="/categoria/entretenimiento" className="text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all bg-white px-8 py-4 border border-gray-100 shadow-sm">Explorar Carpeta</Link>
                </div>
                <div className="flex flex-col gap-12">
                   <ArticleCard article={entertainment[0]} variant="wide" />
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {entertainment.slice(1, 4).map(a => (
                        <ArticleCard key={a.id} article={a} variant="medium" className="bg-white p-8 border-0 shadow-sm" />
                      ))}
                   </div>
                </div>
            </div>
         </section>
      )}

      {/* ── Opinion Section (The Guest Column) ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 mb-12">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4 border-r border-gray-100 pr-12">
               <span className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600 block mb-6 italic">El Editorial</span>
               <h2 className="text-4xl font-serif italic text-black leading-tight mb-8">Voces que Definen la Agenda</h2>
               <p className="text-slate-500 font-serif leading-relaxed text-sm">Análisis de profundidad por los expertos más influyentes del país.</p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-12">
               {(opinions.length > 0 ? opinions : latest.slice(8, 11)).map(a => (
                 <ArticleCard key={a.id} article={a} variant="editorial" />
               ))}
            </div>
         </div>
      </section>

      <div className="text-center py-16 border-t border-gray-100 bg-slate-50/10">
         <p className="text-[10px] font-black uppercase tracking-[1em] text-slate-300 mb-8 italic">Imperio Público</p>
         <Link href="/categoria/noticias" className="inline-block bg-black text-white px-12 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all shadow-xl">Ver Archivo Completo</Link>
      </div>
      <section className="bg-gray-50 py-20 border-t border-gray-100">
        <NewsletterBox />
      </section>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}
