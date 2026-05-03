// components/AdUnit.jsx — Espacio publicitario con reserva de espacio (CLS Prevention)
'use client';
import { useEffect } from 'react';
import { SITE_CONFIG, ADS_SLOTS } from '@/lib/data';

export default function AdUnit({ slot, format = 'rectangle', className = '' }) {
  // Mapeo dinámico: si el slot pasado es una llave de ADS_SLOTS, usar su valor.
  const finalSlot = ADS_SLOTS[slot] || slot;

  useEffect(() => {
    // Si los anuncios están apagados, no iniciamos AdSense
    if (!SITE_CONFIG.showAds) return;
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('AdSense Error:', e);
    }
  }, [slot]);

  // Guardia DESPUÉS de todos los hooks (React Rules of Hooks)
  if (!SITE_CONFIG.showAds) return null;

  const dimensions = {
    leaderboard:  { minHeight: '90px',  label: '728 x 90' },
    rectangle:    { minHeight: '250px', label: '300 x 250' },
    'in-article': { minHeight: '120px', label: 'Native / In-Article' },
  };
  const style = dimensions[format] || dimensions.rectangle;

  return (
    <div className={`ad-container my-8 ${className}`} style={{ minHeight: style.minHeight }}>
      <div className="flex flex-col items-center justify-center relative overflow-hidden" style={{ minHeight: style.minHeight }}>
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-2">
          Publicidad
        </span>
        
        <ins className="adsbygoogle"
             style={{ display: 'block', minWidth: '250px', minHeight: style.minHeight }}
             data-ad-client={SITE_CONFIG.adsenseId}
             data-ad-slot={finalSlot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}
