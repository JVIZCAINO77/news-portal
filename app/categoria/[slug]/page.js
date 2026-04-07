// app/categoria/[slug]/page.js — Página de Categoría (PulsoNoticias 2.0)
import { notFound } from 'next/navigation';
import { getArticlesByCategory } from '@/lib/serverData';
import { getCategoryBySlug } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import AdUnit from '@/components/AdUnit';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: 'Categoría no encontrada' };

  return {
    title: `Sección: ${cat.label} — PulsoNoticias`,
    description: `Explora las últimas noticias sobre ${cat.label} en PulsoNoticias.`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const articles = await getArticlesByCategory(slug, 20);
  const cat = getCategoryBySlug(slug);

  if (!cat) notFound();

  const heroArticle = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-gray-100 py-20 mb-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
           <h1 className="text-[12px] font-black uppercase tracking-[0.6em] text-red-600 mb-6 select-none opacity-50">Sección Editorial</h1>
           <h2 className="text-6xl md:text-9xl font-black text-black leading-none uppercase italic tracking-tighter"> {cat.label} </h2>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6">
        {heroArticle ? (
          <div className="mb-24 border-b border-gray-100 pb-20"> <ArticleCard article={heroArticle} variant="hero" /> </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-slate-300 font-black uppercase tracking-widest bg-gray-50 border border-dashed border-gray-200"> No hay artículos en esta sección aún. </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
          <div className="lg:col-span-3">
             <h3 className="section-title">Más en {cat.label}</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-20"> {gridArticles.map(a => ( <ArticleCard key={a.id} article={a} variant="medium" /> ))} </div>
          </div>
          <aside className="lg:col-span-1 space-y-20 pt-16">
             <div className="bg-white p-0">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-black mb-8 pb-3 border-b border-gray-100">Tendencias</h4>
                <div className="space-y-4"> {gridArticles.slice(0, 5).map(a => ( <ArticleCard key={a.id} article={a} variant="minimal" /> ))} </div>
             </div>
             <AdUnit format="rectangle" />
          </aside>
        </div>
      </div>
    </div>
  );
}
