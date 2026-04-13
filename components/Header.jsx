'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';
import BreakingTicker from './BreakingTicker';
import ServiceWidgets from './ServiceWidgets';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [tickerItems, setTickerItems] = useState([]);

  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('es-DO', options);
    setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

    // Dynamic data for the ticker
    const fetchTicker = async () => {
      try {
        const res = await fetch('/api/articles/latest?limit=10');
        const data = await res.json();
        setTickerItems(data);
      } catch (err) {
        console.error('Ticker fetch error:', err);
      }
    };
    fetchTicker();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return (
    <header className="w-full bg-white transition-all duration-300">
      {/* Top Bar: Date, Utility & Service Widgets */}
      <div className="border-b border-gray-100 py-1.5 hidden md:block bg-white relative z-[60]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          {/* Left: Date */}
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            {currentDate}
          </div>

          {/* Right: Service Widgets (Weather & Currency) */}
          <div className="flex items-center gap-8">
            <ServiceWidgets />
            <div className="h-4 w-px bg-gray-100"></div>
            <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
              <Link href="/nosotros" className="hover:text-red-600 transition-all">Nosotros</Link>
              <Link href="/contacto" className="hover:text-red-600 transition-all">Contacto</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Branding */}
      <div className={`max-w-7xl mx-auto px-6 transition-all duration-500 flex flex-col items-center justify-center ${isScrolled ? 'py-4' : 'py-4 md:py-8'}`}>
        <Link href="/" className="group text-center">
          <h1 className={`font-black tracking-tighter text-black uppercase leading-none transition-all duration-500 ${isScrolled ? 'text-4xl' : 'text-6xl md:text-[7rem]'}`}>
            Imperio<span className="text-red-600">Público</span>
          </h1>
          {!isScrolled && (
            <div className="mt-2 flex items-center justify-center gap-4 transition-opacity duration-500">
               <span className="h-px bg-slate-200 w-8 md:w-16"></span>
               <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.6em] text-slate-400">
                 {SITE_CONFIG.tagline}
               </p>
               <span className="h-px bg-slate-200 w-8 md:w-16"></span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 bg-[#d90429] shadow-lg transition-all duration-300 ${isScrolled ? 'py-1' : 'py-2'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <ul className="flex items-center justify-start lg:justify-center overflow-x-auto no-scrollbar gap-1">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/categoria/${cat.slug}`}
                  className="px-4 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Breaking News Ticker Row */}
      <BreakingTicker items={tickerItems} />

      {/* Trending Row — High Contrast (Only if not scrolled) */}
      {!isScrolled && (
        <div className="max-w-7xl mx-auto px-6 hidden md:flex items-center gap-6 py-3 border-b border-gray-100">
           <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-600 border-r border-gray-100 pr-6 italic">En Tendencia</span>
           <div className="flex gap-8">
              {['#Elecciones2026', '#IA', '#EconomíaRD', '#GrandesLigas', '#Cripto'].map(tag => (
                <Link key={tag} href={`/tag/${tag.replace('#', '')}`} className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-black transition-colors">
                  {tag}
                </Link>
              ))}
           </div>
        </div>
      )}
    </header>
  );
}
