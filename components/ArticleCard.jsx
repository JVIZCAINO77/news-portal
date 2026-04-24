'use client';
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
  
  const clean = (str) => typeof str === 'string' ? str.replace(/#+\s*/g, '').trim() : str;
  const safeTitleRaw = (article.title && typeof article.title === 'string' && article.title.trim() !== "") ? article.title : 'Información en Desarrollo';
  const safeTitle = clean(safeTitleRaw);
  const safeExcerpt = (article.excerpt && typeof article.excerpt === 'string' && article.excerpt.trim() !== "") ? clean(article.excerpt) : null;

  if (variant === 'hero') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block overflow-hidden ${className}`}>
        <article className="relative mt-[7px]">
          <header className="mb-4">
            <h1 className="editorial-title text-2xl md:text-4xl lg:text-5xl mb-[10px]">
               {safeTitle}
             </h1>
          </header>

          <div className="relative w-[95%] md:w-[90%] aspect-[3/2] overflow-hidden bg-slate-100 shadow-md border border-slate-200 mb-4">
            <Image
              src={imgSrc}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1200px) 100vw, 1200px"
              onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
            />
          </div>

          <div>
            {safeExcerpt && (
              <p style={{ color: '#1a1a1a', lineHeight: 1.6 }} className="text-base md:text-xl font-serif line-clamp-3 mb-4 max-w-3xl">
                 {safeExcerpt}
               </p>
            )}
            <div className="flex items-center gap-4">
               <span className="text-black dark:text-white group-hover:text-red-700 transition-colors metadata-text !font-black !tracking-widest uppercase !text-[10px]">{article.author}</span>
               <span className="w-8 h-px bg-slate-200 dark:bg-zinc-800"></span>
               <span className="metadata-text italic !tracking-normal !text-[10px] text-slate-500 dark:text-zinc-500">{formattedDate}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'medium') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block border-b border-gray-100 dark:border-zinc-800 pb-6 h-full ${className}`}>
        <article className="h-full flex flex-col">
          <div className="relative aspect-[4/3] mb-[3px] overflow-hidden bg-slate-100 dark:bg-zinc-800">
            <Image
              src={imgSrc}
              alt={article.imageAlt || article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
            />
          </div>
          <div className="flex-1 flex flex-col">
            {cat?.slug !== 'noticias' && (
              <span className="overline-label mb-[3px] block">
                {cat?.label}
              </span>
            )}
            <h3 className="card-title text-xl md:text-2xl group-hover:text-red-700 transition-colors line-clamp-3 mb-[3px]">
               {safeTitle}
             </h3>
            {safeExcerpt && (
              <p style={{ color: '#1a1a1a', lineHeight: 1.5 }} className="text-sm font-serif line-clamp-3 mb-[3px] flex-1">
                 {safeExcerpt}
               </p>
            )}
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
             {cat?.slug !== 'noticias' && <span className="overline-label text-red-700 mb-2 block">{cat?.label}</span>}
             <h4 className="card-title text-base md:text-lg group-hover:text-red-700 transition-colors line-clamp-2 hover:underline underline-offset-4 decoration-1">
                {safeTitle}
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
                sizes="(max-width: 768px) 224px, 150px"
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
                sizes="(max-width: 768px) 100vw, 600px"
                onError={() => setImgSrc(DEFAULT_PLACEHOLDER)}
              />
           </div>
           <div className="p-8 md:p-12">
              {cat?.slug !== 'noticias' && <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">{cat?.label}</span>}
              <h3 className="card-title text-xl md:text-3xl group-hover:text-red-600 transition-colors mb-[3px]">
                {safeTitle}
              </h3>
              {safeExcerpt && (
                <p className="text-black dark:text-white text-lg font-serif line-clamp-3 leading-relaxed mb-8">
                  {safeExcerpt}
                </p>
              )}
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
             "{safeTitle}"
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
        {cat?.slug !== 'noticias' && (
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-600 mb-1 block">
            {cat?.label}
          </span>
        )}
        <h4 className="text-base font-black text-black group-hover:text-red-600 transition-colors leading-tight uppercase tracking-tight">
          {safeTitle}
        </h4>
      </article>
    </Link>
  );
}
