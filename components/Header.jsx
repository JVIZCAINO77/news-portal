'use client';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';
import * as ga from '@/lib/analytics';
import ServiceWidgets from './ServiceWidgets';
import MobileMenu from './MobileMenu';
import BreakingNews from './BreakingNews';

export default function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
      ga.event({ action: 'search', category: 'engagement', label: searchQuery.trim() });
      router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <div className="w-full">
      <BreakingNews />
      {/* 1. Static Branding Section */}
      <section className="w-full bg-white py-2 md:py-4 border-b border-gray-100 relative">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {/* Mobile Actions Overlay - REINFORCED CLICKABILITY */}
          <div className="md:hidden absolute inset-0 flex justify-between items-center px-4 pointer-events-none z-[60]">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-black text-white rounded-sm pointer-events-auto shadow-lg active:scale-95 transition-transform"
              aria-label="Abrir menú"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 text-black rounded-sm pointer-events-auto shadow-lg active:scale-95 transition-transform"
              aria-label="Buscar noticias"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          <a href="/" className="flex items-center justify-center flex-row gap-6 md:gap-10 hover:opacity-90 transition-opacity">
            <div className="relative h-12 md:h-20 lg:h-24 w-12 md:w-20 lg:w-24">
              <Image 
                src="/icon.png" 
                alt="Logo IP" 
                fill
                priority={true}
                className="object-contain mix-blend-multiply" 
              />
            </div>
            <div className="flex flex-col items-center">
              <span 
                style={{ 
                  color: '#0f0f0f',
                  fontSize: 'clamp(1.5rem, 6vw, 4.5rem)'
                }} 
                className="font-black tracking-[-0.05em] leading-[0.75]"
              >
                Imperio<span style={{ color: '#bb1b21' }}>Público</span>
              </span>
              <div className="flex items-center justify-center gap-4 w-full mt-2">
                <div style={{ height: '1.5px', flex: 1, backgroundColor: '#bb1b21', opacity: 0.2 }}></div>
                <span className="text-[0.7rem] md:text-[0.9rem] font-medium text-gray-900 tracking-normal italic whitespace-nowrap font-sans">
                  La Autoridad de la Actualidad
                </span>
                <div style={{ height: '1.5px', flex: 1, backgroundColor: '#bb1b21', opacity: 0.2 }}></div>
              </div>
            </div>
          </a>
        </div>
      </section>

      {/* 2. Sticky Navigation Main Wrapper */}
      <div className="sticky top-0 z-[100] shadow-md w-full bg-white">
        {/* Primary Navigation - Red Bar */}
        <nav className="w-full bg-[#bb1b21] border-b border-black/10 relative z-50">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <ul className="flex items-center justify-center overflow-x-auto no-scrollbar py-0.5">
              {CATEGORIES.filter(cat => cat.slug !== 'noticias').map((cat) => (
                <li key={cat.slug} className="flex-shrink-0">
                  <Link href={`/categoria/${cat.slug}`} className="block px-3 py-2 text-[14px] font-bold text-white/90 hover:text-white transition-all whitespace-nowrap">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Utility Bar */}
        <div className="border-b border-gray-100 py-1.5 hidden md:block bg-slate-50 relative z-40">
          <div className="max-w-6xl mx-auto px-4 md:px-8 flex justify-between items-center gap-4">
            <div className="text-[10px] font-semibold text-gray-800 uppercase italic tracking-widest shrink-0">{currentDate}</div>
            
            {/* Ticker dinámico */}
            <div className="flex-1 overflow-hidden hidden lg:flex items-center gap-3 border-l border-r border-gray-100 px-6">
              <span className="bg-red-700 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 shrink-0">
                HOY
              </span>
              <div className="overflow-hidden flex-1 relative h-4">
                <div className="absolute inset-0 animate-marquee whitespace-nowrap text-[10px] text-gray-600 font-bold uppercase tracking-tight flex items-center">
                  {tickerItems.length > 0 
                    ? tickerItems.map(n => n.title).join('   •   ')
                    : 'Mantente informado con Imperio Público   •   Noticias en tiempo real   •   La verdad sin filtros'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 shrink-0">
              <ServiceWidgets />
              <div className="h-4 w-px bg-gray-200"></div>
              <form onSubmit={handleSearch} className="relative group flex items-center">
                <input 
                  type="text"
                  placeholder="BUSCAR..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-100/50 border-b border-gray-200 focus:border-red-600 outline-none px-3 py-1 text-[10px] font-black uppercase tracking-widest w-24 focus:w-48 transition-all duration-500 placeholder:text-gray-400"
                />
                <button type="submit" className="ml-2 text-black hover:text-red-600 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
              <div className="flex items-center gap-4 border-r border-gray-200 pr-6 mr-2">
                <a 
                  href={SITE_CONFIG.social.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => ga.event({ action: 'social_click', category: 'engagement', label: 'Facebook Header' })}
                  className="text-gray-500 hover:text-blue-600 transition-colors" 
                  aria-label="Facebook" 
                  title="Facebook"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a 
                  href={SITE_CONFIG.social.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => ga.event({ action: 'social_click', category: 'engagement', label: 'Instagram Header' })}
                  className="text-gray-500 hover:text-pink-600 transition-colors" 
                  aria-label="Instagram" 
                  title="Instagram"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                <a 
                  href={SITE_CONFIG.social.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => ga.event({ action: 'social_click', category: 'engagement', label: 'X Header' })}
                  className="text-gray-500 hover:text-black transition-colors" 
                  aria-label="X (Twitter)" 
                  title="X (Twitter)"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" /></svg>
                </a>
                <a 
                  href={SITE_CONFIG.social.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => ga.event({ action: 'social_click', category: 'engagement', label: 'YouTube Header' })}
                  className="text-gray-500 hover:text-red-600 transition-colors" 
                  aria-label="YouTube" 
                  title="YouTube"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z M9.75 15.02V8.98L15.36 12l-5.61 3.02z"/></svg>
                </a>
                <a 
                  href={`https://wa.me/${SITE_CONFIG.social.whatsapp}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  onClick={() => ga.event({ action: 'social_click', category: 'engagement', label: 'WhatsApp Header' })}
                  className="text-gray-500 hover:text-emerald-500 transition-colors" 
                  aria-label="WhatsApp" 
                  title="WhatsApp"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </a>
              </div>
              <div className="flex gap-4 text-[10px] font-semibold text-gray-800 uppercase tracking-widest">
                <Link href="/nosotros" className="hover:text-red-600 transition-all">Nosotros</Link>
                <Link href="/contacto" className="hover:text-red-600 transition-all">Contacto</Link>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} tickerItems={tickerItems} />
    </div>
  );
}
