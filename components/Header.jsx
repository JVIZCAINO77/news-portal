// components/Header.jsx
'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    const dateStr = new Date().toLocaleDateString('es-DO', {
      timeZone: 'America/Santo_Domingo', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    // Evitar actualización síncrona según react-hooks/set-state-in-effect
    setTimeout(() => setCurrentDate(dateStr), 0);
  }, []);

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled
          ? 'rgba(13,13,13,0.97)'
          : 'var(--color-dark)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid var(--color-border)',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease',
      }}
    >
      {/* Top bar */}
      <div style={{
        background: 'var(--color-primary)',
        padding: '4px 0',
      }}>
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.9)' }}>
            {currentDate.charAt(0).toUpperCase() + currentDate.slice(1)}
          </span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {/* El Panel de Admin ahora está oculto al público. Acceso manual a /admin */}
          </div>
        </div>
      </div>

      {/* Logo bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 40, height: 40,
            background: 'var(--color-primary)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-heading)',
            fontWeight: 900, fontSize: 22, color: '#fff',
          }}>P</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 900, fontSize: 26, color: '#fff', lineHeight: 1,
              letterSpacing: '-0.02em',
            }}>
              Pulso<span style={{ color: 'var(--color-primary)' }}>Noticias</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {SITE_CONFIG.tagline}
            </div>
          </div>
        </Link>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/buscar" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)',
            borderRadius: 8, padding: '8px 14px',
            color: 'var(--color-text-muted)', fontSize: 13,
            textDecoration: 'none', transition: 'background 0.2s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span className="hidden md:inline">Buscar...</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)',
              borderRadius: 8, padding: '8px 10px', color: '#fff', cursor: 'pointer',
            }}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={{
        borderTop: '1px solid var(--color-border)',
        display: menuOpen ? 'block' : undefined,
      }}>
        <div className="max-w-7xl mx-auto px-4">
          <ul className={`${menuOpen ? 'flex flex-col py-2' : 'hidden md:flex'} flex-row gap-0`} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/categoria/${cat.slug}`}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '10px 14px', textDecoration: 'none',
                    color: 'var(--color-text-muted)', fontSize: 13, fontWeight: 600,
                    letterSpacing: '0.02em', textTransform: 'uppercase',
                    borderBottom: '3px solid transparent',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderBottomColor = cat.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                    e.currentTarget.style.borderBottomColor = 'transparent';
                  }}
                >
                  <span>{cat.emoji}</span>
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
