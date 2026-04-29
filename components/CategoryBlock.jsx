
import Link from 'next/link';
import ArticleCard from './ArticleCard';

export default function CategoryBlock({ category, articles }) {
  if (!articles || articles.length === 0) return null;

  // El primero es más grande, los otros son más pequeños
  const mainArticle = articles[0];
  const otherArticles = articles.slice(1, 4);

  return (
    <section className="py-12 border-t border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black uppercase tracking-tighter italic border-l-4 border-red-600 pl-4">
          {category.label}
        </h2>
        <Link 
          href={`/categoria/${category.slug}`} 
          className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-600 transition-colors"
        >
          Ver Todo +
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Artículo principal de la categoría */}
        <div className="lg:col-span-7">
          <ArticleCard article={mainArticle} variant="medium" className="!border-0 !pb-0" />
        </div>

        {/* Artículos secundarios de la categoría */}
        <div className="lg:col-span-5 space-y-2">
          {otherArticles.map((art) => (
            <ArticleCard key={art.id} article={art} variant="small" className="!py-4" />
          ))}
        </div>
      </div>
    </section>
  );
}
