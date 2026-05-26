'use client';
// components/AdUnit.jsx — Espacios publicitarios optimizados (sin CLS, sin espacios vacíos en dev)
import { useEffect } from 'react';
import { SITE_CONFIG, ADS_SLOTS } from '@/lib/data';

export default function AdUnit({ slot, format = 'rectangle', className = '' }) {
  const finalSlot = ADS_SLOTS[slot] || slot;
  const isDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!SITE_CONFIG.showAds || isDev) return;
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {}
  }, [slot]);

  if (!SITE_CONFIG.showAds) return null;
  if (!finalSlot || finalSlot.startsWith('placeholder')) return null;

  // ── EN DESARROLLO: placeholder mínimo, no ocupa espacio visual ──────────
  if (isDev) {
    return (
      <div className={`inline-flex items-center justify-center border border-dashed border-gray-200 rounded-sm bg-gray-50 text-gray-300 ${className}`}
           style={{ minHeight: '28px', padding: '4px 12px' }}>
        <span className="text-[0.45rem] font-bold uppercase tracking-[0.3em]">
          Ad · {format}
        </span>
      </div>
    );
  }

  // ── EN PRODUCCIÓN: AdSense real con reserva de espacio mínima ───────────
  const dimensions = {
    leaderboard:  { height: '90px' },
    rectangle:    { height: '250px' },
    'in-article': { height: '120px' },
  };
  const h = (dimensions[format] || dimensions.rectangle).height;

  return (
    <div className={`ad-container ${className}`} style={{ minHeight: h }}>
      <span className="block text-center text-[0.42rem] font-semibold uppercase tracking-[0.3em] text-gray-300 mb-1">
        Publicidad
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minHeight: h }}
        data-ad-client={SITE_CONFIG.adsenseId}
        data-ad-slot={finalSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
