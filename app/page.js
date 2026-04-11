// app/page.js — Portada de Imperio Público 2.0 (Diseño Premium Moderno)
import Link from 'next/link';
import { getFeaturedArticles, getLatestArticles, getArticlesByCategory } from '@/lib/serverData';
import { CATEGORIES } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidar cada minuto

export default async function HomePage() {
  const featured = await getFeaturedArticles(4);
  const latest = await getLatestArticles(12);
  const sports = await getArticlesByCategory('deportes', 4);
  
  const heroArticle = featured[0];
  const sideFeatured = featured.slice(1, 4);
  const latestGrid = latest.slice(0, 6);

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
          {/* Main Hero */}
          <div className="lg:col-span-8">
            <ArticleCard article={heroArticle} variant="hero" />
          </div>

          {/* Side Column */}
          <div className="lg:col-span-4 border-l border-gray-100 pl-0 lg:pl-12">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8 pb-3 border-b border-gray-100">Destacados</h2>
            <div className="flex flex-col gap-2">
               {sideFeatured.map(a => (
                 <ArticleCard key={a.id} article={a} variant="small" />
               ))}
            </div>
            
            {/* Newsletter Mini-Box */}
            <div className="mt-12 bg-slate-50 p-8 border-t-4 border-red-600">
               <h3 className="text-xl font-black uppercase tracking-tighter mb-2">El Pulso Diario</h3>
               <p className="text-xs text-slate-500 font-serif leading-relaxed mb-6">Recibe las noticias más importantes cada mañana directamente en tu correo.</p>
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

      {/* ── Opinion Section (Grid of Text-only cards) ── */}
      <section className="max-w-7xl mx-auto px-6 py-20 mb-20">
         <h2 className="section-title">Voces y Opinión</h2>
         <div className="grid grid-cols-1 md:grid-cols-4 gap-12 bg-white p-10 border border-gray-100">
            {latest.slice(8, 12).map(a => (
              <ArticleCard key={a.id} article={a} variant="minimal" />
            ))}
         </div>
      </section>

      <div className="text-center py-20 bg-slate-50 border-t border-gray-100">
         <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 mb-6">El Pulso de la Actualidad</p>
         <Link href="/categoria/noticias" className="inline-block bg-black text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-colors">Volver a empezar</Link>
      </div>
    </div>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
}
