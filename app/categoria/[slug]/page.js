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
      
      {/* Category Header (Only restored for Opinion) */}
      {slug === 'opinion' && (
        <div className="border-b border-gray-100 pb-10 pt-16 bg-white relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-6 relative z-10">
             <div className="flex items-center justify-start gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600">Sección Editorial</span>
                <span className="h-px bg-red-600 w-12 opacity-50"></span>
             </div>
             <h1 className="text-6xl md:text-8xl font-black text-black uppercase tracking-tighter leading-none mb-4"> 
               {cat.label} 
             </h1>
          </div>
        </div>
      )}
      
      {/* Editorial Contribution Block (Only for Opinion) */}
      {slug === 'opinion' && (
        <section className="bg-slate-50 border-b border-gray-100 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 mb-6 block">Tribuna Abierta</span>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight mb-8">
                  Tu voz importa en <br/>
                  <span className="text-red-600">Imperio Público</span>
                </h2>
                <p className="text-lg font-serif text-slate-500 leading-relaxed mb-8">
                  ¿Tienes una reflexión, una denuncia o un análisis que deba ser escuchado? 
                  Buscamos ciudadanos comprometidos con la verdad. Envía tu artículo de opinión 
                  y podrías ser nuestro próximo colaborador invitado.
                </p>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-black">1</div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest pt-3">Escribe tu análisis con rigor y respeto.</p>
                </div>
              </div>

              <div className="bg-white p-10 shadow-2xl border border-gray-100">
                <h3 className="text-xl font-black uppercase tracking-tight mb-8 border-b border-black pb-4">Envía tu Opinión</h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="Nombre" className="w-full border-0 border-b border-gray-200 py-3 outline-none focus:border-red-600 font-bold uppercase text-xs" />
                    <input type="email" placeholder="Correo" className="w-full border-0 border-b border-gray-200 py-3 outline-none focus:border-red-600 font-bold uppercase text-xs" />
                  </div>
                  <input type="text" placeholder="Asunto / Título de tu Opinión" className="w-full border-0 border-b border-gray-200 py-3 outline-none focus:border-red-600 font-bold uppercase text-xs" />
                  <textarea placeholder="Tu reflexión..." rows={4} className="w-full border border-gray-100 p-4 outline-none focus:border-red-600 font-serif text-lg bg-slate-50/30"></textarea>
                  <button className="w-full bg-red-600 text-white font-black uppercase tracking-[0.3em] py-5 text-[10px] hover:bg-black transition-all">
                    Enviar a Consejo Editorial
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-0 pb-20">
        {heroArticles.length > 0 ? (
          <div className="flex flex-col gap-20">
             {/* First Highlight */}
             <div className="border-b border-gray-100 pt-0 pb-20">
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
