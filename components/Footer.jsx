// components/Footer.jsx
'use client';
import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--color-dark-2)',
      borderTop: '1px solid var(--color-border)',
      marginTop: 'auto',
    }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, fontSize: 24, color: '#fff', marginBottom: 8 }}>
                Pulso<span style={{ color: 'var(--color-primary)' }}>Noticias</span>
              </div>
            </Link>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
              Tu fuente de información confiable. Noticias, entretenimiento, deportes y más, actualizados al instante.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { icon: 'X', href: '#' },
                { icon: 'FB', href: '#' },
                { icon: 'IG', href: '#' },
                { icon: 'YT', href: '#' },
              ].map(({ icon, href }) => (
                <a key={icon} href={href} style={{
                  width: 34, height: 34, borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid var(--color-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-text-muted)', fontSize: 11, fontWeight: 700,
                  textDecoration: 'none', transition: 'background 0.2s, color 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Secciones */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>Secciones</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CATEGORIES.slice(0, 4).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} style={{
                    color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    <span>{cat.emoji}</span> {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Más secciones */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>Más</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CATEGORIES.slice(4).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} style={{
                    color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13,
                    display: 'flex', alignItems: 'center', gap: 8, transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    <span>{cat.emoji}</span> {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid var(--color-border)' }}>Legal e Información</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Acerca de Nosotros', href: '/nosotros' },
                { label: 'Política de Privacidad', href: '/privacidad' },
                { label: 'Aviso Legal', href: '/aviso-legal' },
                { label: 'Contacto y Publicidad', href: '/contacto' }
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} style={{
                    color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: 13, transition: 'color 0.2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 0' }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <p style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
            © {year} {SITE_CONFIG.name}. Todos los derechos reservados.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
            Hecho con ❤️ para Latinoamérica
          </p>
        </div>
      </div>
    </footer>
  );
}
