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
export default function ArticleCard({ article, variant = 'medium', className = '', extraBadge = null }) {
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
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
               <div className="flex flex-col gap-1">
                  <span className="text-white text-[9px] font-black uppercase tracking-[0.4em] opacity-80">
                    {extraBadge || "Exclusivo"}
                  </span>
                  <span className="text-white text-[11px] font-black uppercase tracking-[0.2em]">{cat?.label}</span>
               </div>
               <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.5em] pb-1">Imperio Público</span>
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-3xl md:text-5xl group-hover:text-red-600 transition-colors mb-4 leading-tight tracking-tighter">
              {article.title}
            </h2>
            <p className="text-slate-600 text-base md:text-lg font-serif line-clamp-2 md:line-clamp-2 leading-relaxed mb-6 max-w-3xl italic">
              {article.excerpt}
            </p>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
               <span className="text-black group-hover:text-red-600 transition-colors uppercase">{article.author}</span>
               <span className="w-6 h-px bg-slate-200"></span>
               <span className="tracking-widest">{formattedDate}</span>
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

  if (variant === 'wide') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block overflow-hidden bg-slate-50 border border-gray-100 ${className}`}>
        <article className="grid grid-cols-1 md:grid-cols-2 items-center">
           <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={article.image}
                alt={article.imageAlt || article.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
           </div>
           <div className="p-8 md:p-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">{cat?.label}</span>
              <h3 className="text-3xl md:text-5xl text-black group-hover:text-red-600 transition-colors leading-none mb-6">
                {article.title}
              </h3>
              <p className="text-slate-600 text-lg font-serif line-clamp-3 leading-relaxed mb-8">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
                 <span className="text-black">Por {article.author}</span>
                 <span className="w-6 h-px bg-slate-200"></span>
                 <span>{formattedDate}</span>
              </div>
           </div>
        </article>
      </Link>
    );
  }

  if (variant === 'editorial') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block text-center p-8 border border-transparent hover:border-gray-100 hover:bg-slate-50/50 transition-all ${className}`}>
        <article>
           <div className="mb-6 mx-auto w-20 h-20 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-xl group-hover:scale-110 transition-transform duration-500">
              {/* Fallback pattern for author if no pic */}
              <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 font-bold text-2xl uppercase">
                 {article.author?.[0]}
              </div>
           </div>
           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4 block italic">Perspectiva</span>
           <h3 className="text-2xl font-serif italic text-black group-hover:text-red-600 transition-colors leading-tight mb-4">
             "{article.title}"
           </h3>
           <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
             {article.author}
           </p>
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
