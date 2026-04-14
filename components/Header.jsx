'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';
import BreakingTicker from './BreakingTicker';
import ServiceWidgets from './ServiceWidgets';
import MobileMenu from './MobileMenu';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');
  const [tickerItems, setTickerItems] = useState([]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('es-DO', options);
    setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);

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
    <header className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-[100] transition-all duration-300 border-b border-gray-100">
      {/* 1. Primary Navigation (Top - Red Bar) - Vibrant Red */}
      <nav className="w-full bg-[#bb1b21] border-b border-black/10 shadow-sm relative z-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar gap-1 py-1">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/categoria/${cat.slug}`}
                  className="px-3 md:px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/90 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* 2. Main Branding & Mobile Toggle Row */}
      <div className={`max-w-7xl mx-auto px-4 md:px-6 transition-all duration-500 ${isScrolled ? 'py-2 md:py-3' : 'py-3 md:py-5'}`}>
        <div className="flex items-center justify-between md:justify-center gap-4">
          
          {/* Hamburger (Left - Only Mobile) */}
          <div className="md:hidden w-12 flex justify-start">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-9 h-9 flex items-center justify-center text-black border border-gray-100 bg-white hover:bg-slate-50 transition-colors shadow-sm focus:ring-2 focus:ring-red-600/20"
              aria-label="Abrir menú"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
          </div>

          {/* Logo (Centered) - More Compact */}
          <div className="flex-1 flex justify-center py-4">
            <Link href="/" className="inline-block group">
              <img 
                src="/logo.png" 
                alt={SITE_CONFIG.name} 
                className={`transition-all duration-500 transform ${isScrolled ? 'h-10 md:h-12' : 'h-16 md:h-28 lg:h-32'}`} 
              />
            </Link>
          </div>

          {/* Spacer (Right - Only Mobile to balance) */}
          <div className="md:hidden w-12"></div>
        </div>
      </div>

      {/* 3. Utility Bar: Date & Service Widgets (Below Branding) */}
      <div className="border-y border-gray-100 py-1.5 hidden md:block bg-slate-50 relative z-40">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
            {currentDate}
          </div>

          <div className="flex items-center gap-8">
            <ServiceWidgets />
            <div className="h-4 w-px bg-gray-200"></div>
            <div className="flex gap-4 text-[9px] font-black uppercase tracking-widest text-slate-500">
              <Link href="/nosotros" className="hover:text-red-600 transition-all">Nosotros</Link>
              <Link href="/contacto" className="hover:text-red-600 transition-all">Contacto</Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Breaking Ticker (Always Visible at Bottom of Header) */}
      <BreakingTicker items={tickerItems} />

      {/* Mobile Menu Drawer */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} tickerItems={tickerItems} />
    </header>
  );
}
