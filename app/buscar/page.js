// app/buscar/page.js — Resultados de Búsqueda (Imperio Público 2.0)
import { searchArticles } from '@/lib/serverData';
import ArticleCard from '@/components/ArticleCard';
import { SITE_CONFIG } from '@/lib/data';

export async function generateMetadata({ searchParams }) {
  const query = (await searchParams).q || '';
  return {
    title: `Resultados para "${query}" | ${SITE_CONFIG.name}`,
    description: `Resultados de búsqueda para ${query} en Imperio Público.`,
  };
}

export default async function SearchPage({ searchParams }) {
  const query = (await searchParams).q || '';
  const results = await searchArticles(query);

  return (
    <main className="min-h-screen bg-white">
      {/* Header de Búsqueda */}
      <section className="bg-slate-50 border-b border-gray-100 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <p className="overline-label !text-red-600 mb-4 animate-fade-in">Buscador Editorial</p>
          <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-black leading-none break-words font-serif">
            {query ? `"${query}"` : 'Busca en el Imperio'}
          </h1>
          <p className="mt-8 text-slate-800 font-serif text-xl italic border-l-4 border-black pl-6">
            {results.length > 0 
              ? `Hemos encontrado ${results.length} artículos que coinciden con tu investigación.`
              : query 
                ? 'No hemos encontrado artículos exactos, pero nuestra redacción sigue trabajando.'
                : 'Escribe una palabra clave arriba para empezar la investigación.'}
          </p>
        </div>
      </section>

      {/* Rejilla de Resultados */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {results.map((article, idx) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                variant={idx === 0 ? "featured" : "medium"}
                className="animate-fade-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center space-y-10">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Sin resultados</h3>
              <p className="text-slate-800 max-w-sm mx-auto font-serif italic">
                Prueba con términos más generales o revisa nuestras categorías principales.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
