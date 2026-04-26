import Link from 'next/link';
import { getLatestArticles } from '@/lib/serverData';
import ArticleCard from '@/components/ArticleCard';

export default async function NotFound() {
  const latest = await getLatestArticles(3);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col items-center justify-center p-6 py-20 text-center">
        <div className="max-w-xl mx-auto">
          <h1 className="text-[8rem] md:text-[12rem] font-black leading-none text-gray-100 tracking-tighter">404</h1>
          <div className="-mt-12 md:-mt-20 bg-white p-6 relative z-10">
            <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-4">Enlace Editorial Roto</h2>
            <p className="text-gray-500 italic mb-10 border-l-4 border-red-600 pl-4 py-2 text-left">
              La noticia o sección que buscas no está disponible en nuestros archivos actuales.
            </p>
            <div className="flex justify-center">
               <Link 
                 href="/" 
                 className="bg-black text-white font-black text-[11px] px-8 py-4 uppercase tracking-[0.2em] hover:bg-red-600 transition-colors"
               >
                 Volver a la Portada Principal
               </Link>
            </div>
          </div>
        </div>
      </div>

      {latest.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-20 border-t border-gray-100">
          <h3 className="section-title">Te recomendamos leer</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {latest.map(a => (
              <ArticleCard key={a.id} article={a} variant="medium" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
