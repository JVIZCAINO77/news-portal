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
      {/* Category Header (Premium Left-Aligned) */}
      <div className="border-y-2 border-black py-16 bg-white relative overflow-hidden">
        {/* Subtle background element (newspaper dot grid) */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-start text-left">
           <div className="flex items-center justify-start gap-4 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600">Sección Editorial</span>
              <span className="h-px bg-red-600 w-12 opacity-50"></span>
           </div>
           <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-black leading-tight uppercase tracking-[-0.03em] mix-blend-multiply"> 
             {cat.label} 
           </h1>
           <p className="mt-4 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] italic max-w-lg border-l-2 border-red-600 pl-4 py-1">
             Archivo completo y reportajes a fondo sobre {cat.label}
           </p>
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
