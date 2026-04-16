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
      const scrollY = window.scrollY;
      // High-Gap Hysteresis para eliminar el temblor por cambio de altura
      if (scrollY > 250) {
        setIsScrolled(true);
      } else if (scrollY <= 10) {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

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
    <div className="w-full">
      {/* 1. Static Branding Section - TOTAL STABILITY, NO MOVEMENT */}
      <section className="w-full bg-white py-8 md:py-12 border-b border-gray-100 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-center flex-row gap-6 md:gap-10">
            <img 
              src="/icon.png" 
              alt="Logo IP" 
              className="h-20 md:h-36 lg:h-44 object-contain mix-blend-multiply" 
            />
            <div className="flex flex-col items-center">
              <h1 style={{ color: '#0f0f0f' }} className="font-black tracking-[-0.05em] uppercase leading-[0.75] text-4xl sm:text-7xl md:text-[7rem] lg:text-[8.5rem]">
                Imperio<span style={{ color: '#bb1b21' }}>Público</span>
              </h1>
              <div className="flex items-center justify-center gap-4 w-full mt-6">
                <div style={{ height: '2px', flex: 1, backgroundColor: '#bb1b21', opacity: 0.3 }}></div>
                <span className="text-[0.65rem] md:text-[0.85rem] font-bold text-gray-900 tracking-[0.45em] uppercase italic whitespace-nowrap">
                  La Autoridad de la Actualidad
                </span>
                <div style={{ height: '2px', flex: 1, backgroundColor: '#bb1b21', opacity: 0.3 }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sticky Navigation Main Wrapper - ONLY THE MENU FOLLOWS THE USER */}
      <div className="sticky top-0 z-[100] shadow-md w-full bg-white">
        {/* Primary Navigation - Red Bar */}
        <nav className="w-full bg-[#bb1b21] border-b border-black/10 relative z-50">
          <div className="max-w-7xl mx-auto px-4">
            <ul className="flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar gap-1 py-1">
              <li><Link href="/" className="px-3 md:px-5 py-2 text-[13px] font-bold text-white hover:bg-white/10 transition-all">Portada</Link></li>
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}><Link href={`/categoria/${cat.slug}`} className="px-3 md:px-5 py-2 text-[13px] font-bold text-white/90 hover:text-white transition-all whitespace-nowrap">{cat.label}</Link></li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Utility Bar: Hidden on mobile, fixed on desktop sticky view */}
        <div className="border-b border-gray-100 py-1.5 hidden md:block bg-slate-50 relative z-40">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="text-[10px] font-semibold text-gray-400 uppercase italic tracking-widest">{currentDate}</div>
            <div className="flex items-center gap-8">
              <ServiceWidgets />
              <div className="h-4 w-px bg-gray-200"></div>
              <div className="flex gap-4 text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                <Link href="/nosotros" className="hover:text-red-600 transition-all">Nosotros</Link>
                <Link href="/contacto" className="hover:text-red-600 transition-all">Contacto</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Breaking Ticker */}
        <BreakingTicker items={tickerItems} />
      </div>

      {/* Mobile Menu Drawer */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} tickerItems={tickerItems} />
    </div>
  );
}
