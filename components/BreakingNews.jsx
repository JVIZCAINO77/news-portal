'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BreakingNews() {
  const [news, setNews] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchBreaking = async () => {
      try {
        const res = await fetch('/api/articles/latest?limit=1', { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const latest = data[0];
          // Solo mostrar si es muy reciente (menos de 2 horas)
          const published = new Date(latest.publishedAt);
          const now = new Date();
          const diffHours = (now - published) / (1000 * 60 * 60);
          
          if (diffHours < 2 || latest.trending) {
            setNews(latest);
            setIsVisible(true);
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Breaking news fetch error:', err);
        }
      }
    };

    fetchBreaking();
    return () => controller.abort();
  }, []);

  if (!isVisible || !news) return null;

  return (
    <div className="bg-red-700 text-white py-1.5 md:py-2 px-4 animate-in fade-in slide-in-from-top duration-700">
      <div className="max-w-6xl mx-auto flex items-center gap-3 md:gap-4">
        <span className="bg-white text-red-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shrink-0 flex items-center gap-1.5 shadow-sm">
          <span className="w-1.5 h-1.5 bg-red-700 rounded-full animate-ping"></span>
          Último Minuto
        </span>
        <Link 
          href={`/articulo/${news.slug}`}
          className="text-[10px] md:text-xs font-bold uppercase tracking-tight hover:underline truncate"
        >
          {news.title}
        </Link>
        <button 
          onClick={() => setIsVisible(false)}
          className="ml-auto text-white/60 hover:text-white transition-colors"
          aria-label="Cerrar alerta"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
