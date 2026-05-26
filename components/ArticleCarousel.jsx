'use client';
// components/ArticleCarousel.jsx — Carrusel horizontal de artículos con flechas
import { useState, useRef } from 'react';
import Link from 'next/link';
import PremiumImage from './PremiumImage';

function formatArticleDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function readingTime(content) {
  if (!content) return 3;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export default function ArticleCarousel({ articles = [], visibleCount = 3 }) {
  const [index, setIndex] = useState(0);
  const maxIndex = Math.max(0, articles.length - visibleCount);

  const prev = () => setIndex(i => Math.max(0, i - 1));
  const next = () => setIndex(i => Math.min(maxIndex, i + 1));

  const visible = articles.slice(index, index + visibleCount);

  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-5">
        {visible.map((art) => (
          <Link key={art.id} href={`/articulo/${art.slug}`} className="group block">
            {art.image && (
              <PremiumImage
                src={art.image}
                alt={art.title}
                category={art.category}
                containerClassName="aspect-[16/9] mb-3 rounded-sm overflow-hidden shadow-md group/img"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                width={400}
              />
            )}
            <span className="text-[0.5rem] font-black text-[#bb1b21] uppercase tracking-[0.2em] block mb-1">
              {art.category === 'noticias' ? 'Nacional' : art.category}
            </span>
            <h3 className="text-[0.82rem] font-black leading-snug group-hover:text-red-700 transition-colors line-clamp-3 tracking-tight mb-2">
              {art.title}
            </h3>
            <div className="flex items-center gap-2 text-[0.5rem] text-gray-400 font-bold uppercase tracking-widest">
              <span>{formatArticleDate(art.publishedAt)}</span>
              <span>·</span>
              <span>{readingTime(art.content)} min de lectura</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Flechas de navegación */}
      {index > 0 && (
        <button
          onClick={prev}
          className="absolute -left-5 top-1/3 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-all z-10"
          aria-label="Anterior"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {index < maxIndex && (
        <button
          onClick={next}
          className="absolute -right-5 top-1/3 -translate-y-1/2 w-9 h-9 bg-white border border-gray-200 shadow-md rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-all z-10"
          aria-label="Siguiente"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
