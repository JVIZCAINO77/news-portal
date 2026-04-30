
'use client';
// components/ArticleCard.jsx — Tarjeta de artículo editorial premium
import { useState } from 'react';
import Link from 'next/link';
import PremiumImage from './PremiumImage';
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
  
  const clean = (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/\\+n/g, ' ') 
      .replace(/#+\s*/g, '') 
      .trim();
  };
  const safeTitle = clean(article.title || 'Información en Desarrollo');
  const safeExcerpt = article.excerpt ? clean(article.excerpt) : null;

  // Badge de Impacto
  const ImpactBadge = () => {
    if (!article.trending && !article.featured) return null;
    return (
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-1">
        {article.trending && (
          <span className="bg-black text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 flex items-center gap-1 animate-pulse">
            <span className="w-1 h-1 bg-red-600 rounded-full"></span> Tendencia
          </span>
        )}
        {article.featured && !article.trending && (
          <span className="bg-red-600 text-white text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5">Destacado</span>
        )}
      </div>
    );
  };


  if (variant === 'hero') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block overflow-hidden ${className}`}>
        <article className="relative transition-all duration-500 hover:translate-y-[-4px]">
          <header className="mb-4">
            <h1 className="editorial-title text-3xl md:text-5xl lg:text-7xl group-hover:text-red-700 transition-colors">
               {safeTitle}
             </h1>
          </header>

          <div className="relative overflow-hidden rounded-2xl shadow-2xl mb-6">
            <ImpactBadge />
            <PremiumImage 
              src={article.image} 
              alt={article.imageAlt || article.title}
              category={article.category}
              containerClassName="w-full aspect-[16/9] md:aspect-[21/9] bg-slate-50"
              className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-[1.02]"
              width={1280}
            />
          </div>

          <div className="max-w-4xl">
            {safeExcerpt && (
              <p className="text-xl md:text-2xl font-serif text-slate-800 line-clamp-3 mb-6 leading-relaxed">
                 {safeExcerpt}
               </p>
            )}
            <div className="flex items-center gap-4">
               <span className="metadata-text !text-[10px] !font-black !text-black">{article.author}</span>
               <span className="w-10 h-px bg-slate-200"></span>
               <span className="metadata-text !text-[10px] !italic text-slate-400">{formattedDate}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'medium') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block border-b border-gray-100 pb-8 h-full transition-all hover:border-red-100 ${className}`}>
        <article className="h-full flex flex-col">
          <div className="relative overflow-hidden rounded-xl shadow-lg mb-5">
            <ImpactBadge />
            <PremiumImage 
              src={article.image} 
              alt={article.imageAlt || article.title}
              category={article.category}
              containerClassName="aspect-[4/3]"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              width={600}
            />
          </div>
          <div className="flex-1 flex flex-col">
            {cat?.slug !== 'noticias' && (
              <span className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-2 block italic">
                {cat?.label}
              </span>
            )}
            <h3 className="card-title text-xl group-hover:text-red-700 transition-colors line-clamp-3 mb-4 leading-tight">
               {safeTitle}
             </h3>
            {safeExcerpt && (
              <p className="text-sm font-serif text-slate-600 line-clamp-3 mb-4 leading-relaxed flex-1">
                 {safeExcerpt}
               </p>
            )}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Por {article.author}</span>
               <span className="text-[9px] font-bold text-slate-400">{formattedDate}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'small') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block py-6 border-b border-gray-100 last:border-0 hover:bg-slate-50/50 transition-all px-4 -mx-4 rounded-xl ${className}`}>
        <article className="flex gap-6 items-center">
          <div className="flex-1 min-w-0">
             {cat?.slug !== 'noticias' && <span className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1 block">{cat?.label}</span>}
             <h4 className="font-bold text-base group-hover:text-red-700 transition-colors line-clamp-2 leading-tight">
                {safeTitle}
              </h4>
             <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
               {formattedDate} · Por {article.author}
             </p>
          </div>
          <div className="relative w-28 h-20 md:w-40 md:h-24 flex-shrink-0 overflow-hidden rounded-lg shadow-md">
            <PremiumImage 
              src={article.image} 
              alt={article.title}
              category={article.category}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              width={400}
            />
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'wide') {
    return (
      <Link href={`/articulo/${article.slug}`} className={`group block overflow-hidden bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl transition-all ${className}`}>
        <article className="grid grid-cols-1 md:grid-cols-2">
           <div className="relative overflow-hidden">
             <ImpactBadge />
             <PremiumImage 
               src={article.image} 
               alt={article.imageAlt || article.title}
               category={article.category}
               containerClassName="aspect-[16/10] md:h-full bg-slate-50"
               className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-[1.02]"
               width={800}
             />
           </div>
           <div className="p-8 md:p-12 flex flex-col justify-center">
              {cat?.slug !== 'noticias' && <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-6 block italic">{cat?.label}</span>}
              <h3 className="editorial-title text-2xl md:text-4xl group-hover:text-red-700 transition-colors mb-6 leading-none">
                {safeTitle}
              </h3>
              {safeExcerpt && (
                <p className="text-slate-700 text-lg font-serif line-clamp-3 leading-relaxed mb-8">
                  {safeExcerpt}
                </p>
              )}
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                    {article.author?.[0]}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-black">{article.author}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{formattedDate}</span>
                 </div>
              </div>
           </div>
        </article>
      </Link>
    );
  }

  // Minimal variant (text only)
  return (
    <Link href={`/articulo/${article.slug}`} className={`group block py-5 border-b border-slate-50 last:border-0 hover:translate-x-1 transition-transform ${className}`}>
      <article>
        <div className="flex items-center gap-2 mb-1.5">
          {cat?.slug !== 'noticias' && (
            <span className="text-[8px] font-black uppercase tracking-widest text-red-600 italic">
              {cat?.label}
            </span>
          )}
          {article.trending && <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>}
        </div>
        <h4 className="text-[15px] font-black text-slate-900 group-hover:text-red-700 transition-colors leading-tight uppercase tracking-tight line-clamp-2">
          {safeTitle}
        </h4>
      </article>
    </Link>
  );
}
