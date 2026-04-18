// components/ArticleCard.jsx — Tarjeta de artículo editorial premium
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCategoryBySlug, formatDate } from '@/lib/data';

const DEFAULT_PLACEHOLDER = '/icon.png';

/**
 * Variants:
 *  'hero'    — Grande, ocupa ancho completo o gran parte.
 *  'medium'  — Tarjeta vertical con imagen arriba.
 *  'small'   — Tarjeta horizontal compacta (estilo lista).
 *  'minimal' — Solo texto (para sidebars).
 */
export default function ArticleCard({ article, variant = 'medium', className = '', extraBadge = null }) {
  const [imgSrc, setImgSrc] = useState(article?.image || DEFAULT_PLACEHOLDER);
  
  if (!article) return null;
  const cat = getCategoryBySlug(article.category);
  const formattedDate = formatDate(article.publishedAt);

  if (variant === 'hero') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block overflow-hidden ${className}`}>
        <article className="relative">
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-slate-100">
            <Image
              src={imgSrc}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover"
              priority
              onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
            />
          </div>
          <header className="mb-12">
            <h1 style={{ fontWeight: 900, letterSpacing: '-0.05em', lineHeight: 1.1, color: '#111827' }} className="text-2xl md:text-4xl lg:text-5xl mb-8 font-serif">
               {article.title}
             </h1>
            <p style={{ color: '#000000', fontStyle: 'italic', lineHeight: 1.7 }} className="text-base md:text-xl font-serif line-clamp-3 mb-8 max-w-3xl border-l-4 border-red-600 pl-6">
               {article.excerpt}
             </p>
            <div className="flex items-center gap-6">
               <span className="text-black dark:text-white group-hover:text-red-700 transition-colors metadata-text !font-black !tracking-widest uppercase !text-[10px]">{article.author}</span>
               <span className="w-12 h-px bg-slate-200 dark:bg-zinc-800"></span>
               <span className="metadata-text italic !tracking-normal !text-[10px] text-slate-500 dark:text-zinc-500">{formattedDate}</span>
            </div>
          </header>
        </article>
      </Link>
    );
  }

  if (variant === 'medium') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block border-b border-gray-100 dark:border-zinc-800 pb-12 h-full ${className}`}>
        <article className="h-full flex flex-col">
          <div className="relative aspect-[4/3] mb-8 overflow-hidden bg-slate-100 dark:bg-zinc-800">
            <Image
              src={imgSrc}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover"
              onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <span className="overline-label mb-4 block">
              {cat?.label}
            </span>
            <h3 style={{ fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#111827' }} className="text-xl md:text-2xl group-hover:text-red-700 transition-colors line-clamp-3 mb-4 font-serif">
               {article.title}
             </h3>
            <p style={{ color: '#000000', fontStyle: 'italic', lineHeight: 1.65 }} className="text-sm font-serif line-clamp-3 mb-6 flex-1">
               {article.excerpt}
             </p>
            <p className="metadata-text uppercase tracking-widest mt-auto border-t border-gray-50 dark:border-zinc-900 pt-6 !text-[9px] text-slate-400 dark:text-zinc-500">
              Por {article.author}
            </p>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'small') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block py-10 border-b border-gray-100 dark:border-zinc-800 last:border-0 ${className}`}>
        <article className="flex gap-10 items-start">
          <div className="flex-1 min-w-0">
             <span className="overline-label text-red-700 mb-2 block">{cat?.label}</span>
             <h4 style={{ fontWeight: 900, color: '#111827', lineHeight: 1.2, letterSpacing: '-0.02em' }} className="text-base md:text-lg group-hover:text-red-700 transition-colors line-clamp-2 hover:underline underline-offset-4 decoration-1 font-serif">
                {article.title}
              </h4>
             <p className="metadata-text mt-8 opacity-60 !text-[8px] dark:text-zinc-500">
               {formattedDate}
             </p>
          </div>
          {article.image && (
            <div className="relative w-32 h-20 md:w-56 md:h-36 flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-zinc-800">
              <Image
                src={imgSrc}
                alt={article.imageAlt || article.title}
                fill
                className="object-cover"
                onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
              />
            </div>
          )}
        </article>
      </Link>
    );
  }

  if (variant === 'wide') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block overflow-hidden bg-slate-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 ${className}`}>
        <article className="grid grid-cols-1 md:grid-cols-2 items-center">
           <div className="relative aspect-[16/10] overflow-hidden">
              <Image
                src={imgSrc}
                alt={article.imageAlt || article.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
              />
           </div>
           <div className="p-8 md:p-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">{cat?.label}</span>
              <h3 style={{ fontWeight: 900, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.04em' }} className="text-xl md:text-3xl group-hover:text-red-600 transition-colors mb-5 font-serif">
                {article.title}
              </h3>
              <p className="text-black dark:text-white text-lg font-serif line-clamp-3 leading-relaxed mb-8 italic">
                {article.excerpt}
              </p>
              <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-zinc-500">
                 <span className="text-black dark:text-white">Por {article.author}</span>
                 <span className="w-6 h-px bg-slate-200 dark:bg-zinc-800"></span>
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
