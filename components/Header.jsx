'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';
import BreakingTicker from './BreakingTicker';
import ServiceWidgets from './ServiceWidgets';
import MobileMenu from './MobileMenu';

export default function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [tickerItems, setTickerItems] = useState([]);

  useEffect(() => {
    if (isMenuOpen || isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMenuOpen, isSearchOpen]);

  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('es-DO', options);
    setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));

    const handleScroll = () => {
      const scrollY = window.scrollY;
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="w-full">
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 flex items-center justify-center p-6">
          <button 
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-10 right-10 text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <form onSubmit={handleSearch} className="w-full max-w-4xl space-y-8">
            <p className="text-red-600 font-black uppercase tracking-[0.4em] text-center italic text-sm">¿Qué estás investigando hoy?</p>
            <input 
              autoFocus
              type="text"
              placeholder="Escribe y presiona Enter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-b-4 border-white/10 focus:border-red-600 outline-none text-white text-4xl md:text-7xl font-black uppercase tracking-tighter py-6 transition-all placeholder:text-white/10"
            />
            <div className="flex justify-center gap-8 text-white/30 text-[10px] font-black uppercase tracking-widest pt-4">
               {['Economía', 'Justicia', 'Política', 'Actualidad'].map(tag => (
                 <button key={tag} type="button" onClick={() => setSearchQuery(tag)} className="hover:text-red-600 transition-colors italic">{tag}</button>
               ))}
            </div>
          </form>
        </div>
      )}

      {/* 1. Static Branding Section */}
      <section className="w-full bg-white py-2 md:py-4 border-b border-gray-100 relative">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Mobile Actions Overlay */}
          <div className="md:hidden absolute top-1/2 -translate-y-1/2 left-6 right-6 flex justify-between items-center pointer-events-none">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-sm pointer-events-auto"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-gray-100 text-black rounded-sm pointer-events-auto shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center flex-row gap-6 md:gap-10">
            <img 
              src="/icon.png" 
              alt="Logo IP" 
              className="h-12 md:h-20 lg:h-24 object-contain mix-blend-multiply" 
            />
            <div className="flex flex-col items-center">
              <h1 
                style={{ 
                  color: '#0f0f0f',
                  fontSize: 'clamp(1.5rem, 6vw, 4.5rem)'
                }} 
                className="font-black tracking-[-0.05em] uppercase leading-[0.75]"
              >
                Imperio<span style={{ color: '#bb1b21' }}>Público</span>
              </h1>
              <div className="flex items-center justify-center gap-4 w-full mt-2">
                <div style={{ height: '1.5px', flex: 1, backgroundColor: '#bb1b21', opacity: 0.2 }}></div>
                <span className="text-[0.5rem] md:text-[0.7rem] font-bold text-gray-900 tracking-[0.35em] uppercase italic whitespace-nowrap">
                  La Autoridad de la Actualidad
                </span>
                <div style={{ height: '1.5px', flex: 1, backgroundColor: '#bb1b21', opacity: 0.2 }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Sticky Navigation Main Wrapper */}
      <div className="sticky top-0 z-[100] shadow-md w-full bg-white">
        {/* Primary Navigation - Red Bar */}
        <nav className="w-full bg-[#bb1b21] border-b border-black/10 relative z-50">
          <div className="max-w-6xl mx-auto px-4">
            <ul className="flex items-center justify-center overflow-x-auto no-scrollbar py-0.5">
              <li className="flex-shrink-0">
                <Link href="/" className="block px-3 py-2 text-[12px] font-black uppercase text-white hover:bg-white/10 transition-all whitespace-nowrap">
                  Portada
                </Link>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat.slug} className="flex-shrink-0">
                  <Link href={`/categoria/${cat.slug}`} className="block px-3 py-2 text-[12px] font-black uppercase text-white/90 hover:text-white transition-all whitespace-nowrap">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Utility Bar */}
        <div className="border-b border-gray-100 py-1.5 hidden md:block bg-slate-50 relative z-40">
          <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
            <div className="text-[10px] font-semibold text-gray-400 uppercase italic tracking-widest">{currentDate}</div>
            <div className="flex items-center gap-8">
              <ServiceWidgets />
              <div className="h-4 w-px bg-gray-200"></div>
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-black hover:text-red-600 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </button>
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
