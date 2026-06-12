'use client';
// components/AdUnit.jsx — Espacios publicitarios sin espacio forzado cuando no hay anuncio
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
  }, [slot, isDev]);

  if (!SITE_CONFIG.showAds) return null;
  if (!finalSlot || finalSlot.startsWith('placeholder')) return null;

  // ── EN DESARROLLO: label mínimo de 1 línea ──────────────────────────────
  if (isDev) {
    return (
      <div className={`inline-flex items-center justify-center border border-dashed border-gray-200 rounded-sm bg-gray-50 text-gray-300 ${className}`}
           style={{ minHeight: '20px', padding: '2px 10px' }}>
        <span className="text-[0.4rem] font-bold uppercase tracking-[0.3em]">Ad · {format}</span>
      </div>
    );
  }

  // ── EN PRODUCCIÓN: AdSense controla su propio tamaño ────────────────────
  // NO forzamos minHeight — si el slot no se llena, no ocupa espacio
  return (
    <div className={`ad-unit-wrapper ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={SITE_CONFIG.adsenseId}
        data-ad-slot={finalSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
