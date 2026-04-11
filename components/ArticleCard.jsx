// components/ArticleCard.jsx — Tarjeta de artículo editorial premium
import Link from 'next/link';
import Image from 'next/image';
import { getCategoryBySlug, formatDate } from '@/lib/data';

/**
 * Variants:
 *  'hero'    — Grande, ocupa ancho completo o gran parte.
 *  'medium'  — Tarjeta vertical con imagen arriba.
 *  'small'   — Tarjeta horizontal compacta (estilo lista).
 *  'minimal' — Solo texto (para sidebars).
 */
export default function ArticleCard({ article, variant = 'medium', className = '' }) {
  if (!article) return null;
  const cat = getCategoryBySlug(article.category);
  const formattedDate = formatDate(article.publishedAt);

  if (variant === 'hero') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block overflow-hidden ${className}`}>
        <article className="relative">
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-slate-100">
            <Image
              src={article.image}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            {/* Premium Branding Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
               <div className="flex flex-col gap-1">
                  <span className="text-white text-[8px] font-black uppercase tracking-[0.4em] opacity-60">Exclusivo</span>
                  <span className="text-white text-xs font-black uppercase tracking-[0.2em]">{cat?.label}</span>
               </div>
               <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.5em] pb-1">Imperio Público</span>
            </div>
            {cat && (
              <div className="absolute top-6 left-6 bg-red-600 px-4 py-2 shadow-2xl">
                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">
                  {cat.label}
                </span>
              </div>
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-4xl md:text-7xl group-hover:text-red-600 transition-colors mb-6 leading-none">
              {article.title}
            </h2>
            <p className="text-slate-600 text-lg md:text-xl font-serif line-clamp-2 md:line-clamp-3 leading-relaxed mb-8 max-w-4xl">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
               <span className="text-black">{article.author}</span>
               <span className="w-8 h-px bg-slate-200"></span>
               <span>{formattedDate}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'medium') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block border-b border-gray-100 pb-10 h-full ${className}`}>
        <article className="h-full flex flex-col">
          <div className="relative aspect-[4/3] mb-6 overflow-hidden bg-slate-100">
            <Image
              src={article.image}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover group-hover:brightness-90 transition-all duration-300"
            />
            {/* Branding Overlay (Medium) */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
               <span className="text-white text-[8px] font-black uppercase tracking-[0.3em]">PN | {cat?.label}</span>
               <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex-1 flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-600 mb-3 block">
              {cat?.label}
            </span>
            <h3 className="text-2xl md:text-3xl text-black group-hover:text-red-600 transition-colors line-clamp-3 leading-none mb-4">
              {article.title}
            </h3>
            <p className="text-slate-600 text-base font-serif line-clamp-2 leading-relaxed mb-6 flex-1">
              {article.excerpt}
            </p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-auto">
              Por {article.author}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'small') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block py-6 border-b border-gray-100 last:border-0 ${className}`}>
        <article className="flex gap-6 items-start">
          <div className="flex-1 min-w-0">
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-600 mb-2 block">{cat?.label}</span>
             <h4 className="text-lg md:text-xl text-black group-hover:text-red-600 transition-colors line-clamp-2 leading-tight">
               {article.title}
             </h4>
             <p className="text-[9px] font-bold text-slate-400 uppercase mt-3 tracking-widest leading-none">
               {formattedDate}
             </p>
          </div>
          {article.image && (
            <div className="relative w-24 h-16 md:w-32 md:h-20 flex-shrink-0 overflow-hidden bg-slate-100">
              <Image
                src={article.image}
                alt={article.imageAlt || article.title}
                fill
                className="object-cover"
              />
              {/* Ultra-subtle Branding (Small) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <span className="absolute bottom-1 right-2 text-white/50 text-[6px] font-black uppercase tracking-widest">PN</span>
            </div>
          )}
        </article>
      </Link>
    );
  }

  // Minimal variant (text only)
  return (
    <Link href={`/articulo/${article.slug}`} className={`group block py-4 border-b border-gray-100 last:border-0 ${className}`}>
      <article>
        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-600 mb-1 block">
          {cat?.label}
        </span>
        <h4 className="text-base font-black text-black group-hover:text-red-600 transition-colors leading-tight uppercase tracking-tight">
          {article.title}
        </h4>
      </article>
    </Link>
  );
}
