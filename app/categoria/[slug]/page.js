// app/categoria/[slug]/page.js — Página de Categoría (Imperio Público 2.0)
import { notFound } from 'next/navigation';
import { getArticlesByCategory } from '@/lib/serverData';
import { getCategoryBySlug } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import AdUnit from '@/components/AdUnit';

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: 'Categoría no encontrada' };

  const title = `${cat.label} — Imperio Público`;
  const description = `Últimas noticias de ${cat.label} en Imperio Público. Información veraz, análisis editorial y cobertura en tiempo real sobre ${cat.label.toLowerCase()} en República Dominicana y el mundo.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/categoria/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://imperiopublico.com/categoria/${slug}`,
      siteName: 'Imperio Público',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${cat.label} — Imperio Público` }],
      type: 'website',
      locale: 'es_DO',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
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
    <main className="bg-white min-h-screen">
      
      <div className="max-w-6xl mx-auto px-6 pt-0 pb-20">
        {/* Cabecera de Categoría */}
        <div className="border-b-4 border-black pt-8 pb-4 mb-8">
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
            {cat.label}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mt-2">
            Últimas noticias · Imperio Público
          </p>
        </div>

        {heroArticles.length > 0 ? (
          <div className="flex flex-col gap-8">
             {/* First Highlight */}
             <div className="border-b border-gray-100 pt-0 pb-12">
                <ArticleCard article={heroArticles[0]} variant="hero" />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                {/* Main Feed */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                   {/* Second Highlight (Wide) */}
                   {heroArticles[1] && <ArticleCard article={heroArticles[1]} variant="wide" />}
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                      {remainingArticles.map(a => (
                        <ArticleCard key={a.id} article={a} variant="medium" />
                      ))}
                   </div>
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-4 border-l border-gray-100 pl-0 lg:pl-16 space-y-12">
                   <div className="sticky top-32 space-y-12">
                      <div className="bg-white p-0">
                         <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-black mb-8 pb-3 border-b border-gray-100 italic">Tendencias en {cat.label}</h2>
                         <div className="space-y-4">
                            {remainingArticles.slice(0, 6).map(a => (
                              <ArticleCard key={a.id} article={a} variant="minimal" />
                            ))}
                         </div>
                      </div>
                      <AdUnit format="rectangle" slot="category_top" />
                   </div>
                </aside>
             </div>
          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 font-black uppercase tracking-widest bg-gray-50 border border-dashed border-gray-200 p-10 text-center">
             <span className="text-6xl mb-6 opacity-20">📰</span>
             <p>Estamos preparando las mejores noticias de esta sección para ti.</p>
             <p className="text-[10px] mt-4 opacity-50 tracking-[0.3em]">Vuelve pronto — Imperio Público</p>
          </div>
        )}
      </div>
    </main>
  );
}
