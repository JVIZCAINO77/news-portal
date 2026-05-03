// components/LoadMore.jsx — Botón de Paginación Editorial (Imperio Público 2.0)
'use client';
import { useState } from 'react';
import Link from 'next/link';

// Misma lógica que PremiumImage: Cloudinary directo, resto por proxy
const getDisplaySrc = (url) => {
  if (!url) return null;
  if (url.includes('cloudinary.com') || url.includes('unsplash.com')) return url;
  if (url.startsWith('http')) return `/api/proxy-image?url=${encodeURIComponent(url)}`;
  return url;
};

export default function LoadMore({ initialOffset = 30 }) {
  const [articles, setArticles] = useState([]);
  const [offset, setOffset] = useState(initialOffset);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/articles/paginated?limit=12&offset=${offset}`);
      const newArticles = await res.json();

      if (newArticles.length < 12) {
        setHasMore(false);
      }

      if (newArticles.length > 0) {
        setArticles([...articles, ...newArticles]);
        setOffset(offset + newArticles.length);
      }
    } catch (err) {
      console.error('Error loading more articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <>
      {/* Rejilla de nuevos artículos cargados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16 px-4 md:px-0">
        {articles.map((art, idx) => (
          <Link 
            key={`${art.id}-${idx}`} 
            href={`/articulo/${art.slug}`} 
            className="group block animate-fade-up"
            style={{ animationDelay: `${(idx % 12) * 0.05}s` }}
          >
            <article>
              {art.image && (
                <div className="relative aspect-[16/9] overflow-hidden mb-4 bg-slate-900 border border-gray-100 shadow-md rounded-sm flex items-center justify-center group/img">
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={getDisplaySrc(art.image)} 
                      className="w-full h-full object-cover blur-2xl opacity-40" 
                      alt="" 
                    />
                  </div>
                  <img 
                    src={getDisplaySrc(art.image)} 
                    alt={art.title} 
                    className="relative z-10 w-auto h-auto max-w-full max-h-full object-contain transition-transform duration-500 group-hover/img:scale-110" 
                  />
                </div>
              )}
              {art.category?.toLowerCase() !== 'noticias' && (
                <span className="text-[0.6rem] font-black text-[#bb1b21] uppercase tracking-[0.2em] mb-2 block">
                  {art.category}
                </span>
              )}
              <h3 className="text-lg font-black leading-tight font-serif text-[#111827] group-hover:text-red-700 transition-colors line-clamp-3">
                {art.title}
              </h3>
              <p className="text-[0.65rem] text-gray-400 font-bold mt-3 uppercase tracking-wider">{formatDate(art.publishedAt)}</p>
            </article>
          </Link>
        ))}
      </div>

      {/* Botón de control */}
      {hasMore && (
        <div className="flex justify-center py-12 border-t border-gray-100 mt-12 mb-20">
          <button 
            onClick={loadMore}
            disabled={loading}
            className="group relative px-10 py-4 bg-black text-white overflow-hidden transition-all hover:pr-14 disabled:opacity-50"
          >
            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em]">
              {loading ? 'Consultando Archivos...' : 'Cargar más Historias'}
            </span>
            <span className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300">
              →
            </span>
            {loading && (
              <div className="absolute inset-0 bg-red-600 animate-pulse opacity-20"></div>
            )}
          </button>
        </div>
      )}

      {!hasMore && articles.length > 0 && (
        <div className="text-center py-12 text-gray-300 italic font-serif border-t border-gray-50 mt-12">
          Has llegado al final de la edición de hoy.
        </div>
      )}
    </>
  );
}
