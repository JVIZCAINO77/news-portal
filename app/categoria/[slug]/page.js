// app/categoria/[slug]/page.js — Página de Categoría (Imperio Público 2.0)
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
    title: `Sección: ${cat.label} — Imperio Público`,
    description: `Explora las últimas noticias sobre ${cat.label} en Imperio Público.`,
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const articles = await getArticlesByCategory(slug, 20);
  const cat = getCategoryBySlug(slug);

  if (!cat) notFound();

  const heroArticles = articles.slice(0, 2);
  const remainingArticles = articles.slice(2);

  return (
    <div className="bg-white min-h-screen">
      {/* Category Header (Premium Elegant) */}
      <div className="border-b border-gray-100 py-16 md:py-24 bg-slate-50/30">
        <div className="max-w-7xl mx-auto px-6">
           <div className="flex items-center gap-4 mb-6">
              <span className="h-px bg-red-600 w-12"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-red-600">Sección Editorial</span>
           </div>
           <h1 className="text-6xl md:text-9xl font-black text-black leading-none uppercase italic tracking-tighter"> 
             {cat.label} 
           </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        {heroArticles.length > 0 ? (
          <div className="flex flex-col gap-20">
             {/* First Highlight */}
             <div className="border-b border-gray-100 pb-20">
                <ArticleCard article={heroArticles[0]} variant="hero" />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
                {/* Main Feed */}
                <div className="lg:col-span-8 flex flex-col gap-16">
                   {/* Second Highlight (Wide) */}
                   {heroArticles[1] && <ArticleCard article={heroArticles[1]} variant="wide" />}
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-16">
                      {remainingArticles.map(a => (
                        <ArticleCard key={a.id} article={a} variant="medium" />
                      ))}
                   </div>
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-4 border-l border-gray-100 pl-0 lg:pl-16 space-y-20">
                   <div className="sticky top-32 space-y-20">
                      <div className="bg-white p-0">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-black mb-8 pb-3 border-b border-gray-100 italic">Tendencias en {cat.label}</h4>
                         <div className="space-y-4">
                            {remainingArticles.slice(0, 6).map(a => (
                              <ArticleCard key={a.id} article={a} variant="minimal" />
                            ))}
                         </div>
                      </div>
                      <AdUnit format="rectangle" />
                   </div>
                </aside>
             </div>
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-slate-300 font-black uppercase tracking-widest bg-gray-50 border border-dashed border-gray-200">
             No hay artículos en esta sección aún.
          </div>
        )}
      </div>
    </div>
  );
}
