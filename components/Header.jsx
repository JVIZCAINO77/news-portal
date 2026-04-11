// components/Header.jsx — Cabecera Moderna y Editorial
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('es-DO', options);
    setCurrentDate(dateStr.charAt(0).toUpperCase() + dateStr.slice(1));

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="w-full bg-white transition-all duration-300">
      {/* Top Bar: Date & Info */}
      <div className="border-b border-gray-100 py-2 hidden md:block">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
          <span>{currentDate}</span>
          <div className="flex gap-4">
            <Link href="/nosotros" className="hover:text-red-600">Nosotros</Link>
            <Link href="/contacto" className="hover:text-red-600">Contacto</Link>
          </div>
        </div>
      </div>

      {/* Main Branding */}
      <div className="max-w-7xl mx-auto px-6 py-6 md:py-10 flex flex-col items-center justify-center">
        <Link href="/" className="group text-center">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-black uppercase leading-none group-hover:text-red-600 transition-colors">
            Pulso<span className="text-red-600 group-hover:text-black">Noticias</span>
          </h1>
          <p className="mt-3 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] text-slate-400">
            {SITE_CONFIG.tagline}
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 bg-white border-y border-gray-100 transition-shadow ${isScrolled ? 'shadow-md' : ''}`}>
        <div className="max-w-7xl mx-auto px-6">
          <ul className="flex items-center justify-start lg:justify-center overflow-x-auto no-scrollbar py-1">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/categoria/${cat.slug}`}
                  className="px-4 py-4 nav-link inline-block whitespace-nowrap"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
