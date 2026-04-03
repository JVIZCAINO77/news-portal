// components/AdUnit.jsx — Componente reutilizable de publicidad AdSense
'use client';
import { useEffect, useRef } from 'react';
import { SITE_CONFIG } from '@/lib/data';

/**
 * Props:
 *  slot        — ID del slot de AdSense (ej: "1234567890")
 *  format      — 'auto' | 'rectangle' | 'leaderboard' | 'in-article'
 *  style       — estilos adicionales para el contenedor
 *  className   — clase extra
 *  label       — mostrar etiqueta "Publicidad" (default: true)
 */
export default function AdUnit({ slot, format = 'auto', style = {}, className = '', label = true }) {
  const adRef = useRef(null);
  const pushed = useRef(false);
  const isConfigured = SITE_CONFIG.adsenseId && !SITE_CONFIG.adsenseId.includes('XXXXX');

  useEffect(() => {
    if (!isConfigured || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {
      // AdSense no disponible aún
    }
  }, [isConfigured]);

  // Placeholder cuando AdSense no está configurado
  if (!isConfigured) {
    const sizes = {
      leaderboard: { width: '100%', maxWidth: 728, height: 90 },
      rectangle: { width: 300, height: 250 },
      'in-article': { width: '100%', height: 120 },
      auto: { width: '100%', height: 90 },
    };
    const size = sizes[format] || sizes.auto;

    return (
      <div
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          ...style,
        }}
      >
        {label && (
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            Publicidad
          </span>
        )}
        <div
          style={{
            width: size.width,
            maxWidth: size.maxWidth || '100%',
            height: size.height,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontWeight: 500 }}>
            Anuncio Google AdSense • {format}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ textAlign: 'center', ...style }}>
      {label && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: 4 }}>
          Publicidad
        </span>
      )}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={SITE_CONFIG.adsenseId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}
