// components/AdUnit.jsx — Espacio publicitario con reserva de espacio (CLS Prevention)
'use client';
import { useEffect, useState } from 'react';
import { SITE_CONFIG } from '@/lib/data';

export default function AdUnit({ slot, format = 'rectangle', className = '' }) {
  const [adLoaded, setAdLoaded] = useState(false);

  // Dimensiones estándar de anuncios
  const dimensions = {
    leaderboard: { minHeight: '90px', width: '100%', label: '728 x 90' },
    rectangle: { minHeight: '280px', width: '100%', label: '300 x 250' },
    'in-article': { minHeight: '280px', width: '100%', label: 'Native / In-Article' },
  };

  const style = dimensions[format] || dimensions.rectangle;

  useEffect(() => {
    // Simulación de carga de AdSense
    try {
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setAdLoaded(true);
      }
    } catch (e) {
      console.error('AdSense Error:', e);
    }
  }, [slot]);

  return (
    <div className={`ad-container my-10 ${className}`} style={{ minHeight: style.minHeight }}>
      <div className="flex flex-col items-center justify-center bg-gray-50 border-y border-gray-100 py-10 relative overflow-hidden">
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-4">Publicidad</span>
        
        {/* Placeholder visual elegante */}
        <div className="border border-dashed border-gray-200 p-8 text-center">
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{style.label}</p>
        </div>

        {/* Script Real de AdSense (Comentado hasta producción real) */}
        {/* 
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-client={SITE_CONFIG.adsenseId}
             data-ad-slot={slot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
        */}
      </div>
    </div>
  );
}
