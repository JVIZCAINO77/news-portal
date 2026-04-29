// components/AdUnit.jsx — Espacio publicitario con reserva de espacio (CLS Prevention)
'use client';
import { useEffect, useState } from 'react';
import { SITE_CONFIG, ADS_SLOTS } from '@/lib/data';

export default function AdUnit({ slot, format = 'rectangle', className = '' }) {
  const [adLoaded, setAdLoaded] = useState(false);

  // Mapeo dinámico: si el slot pasado es una llave de ADS_SLOTS, usar su valor.
  const finalSlot = ADS_SLOTS[slot] || slot;

  // Si los anuncios globales están apagados, esconder silenciosamente este componente
  if (!SITE_CONFIG.showAds) return null;

  // Dimensiones estándar de anuncios

  const dimensions = {
    leaderboard: { minHeight: '90px', width: '100%', label: '728 x 90' },
    rectangle: { minHeight: '250px', width: '100%', label: '300 x 250' },
    'in-article': { minHeight: '120px', width: '100%', label: 'Native / In-Article' },
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
    <div className={`ad-container ${adLoaded ? 'my-8' : 'my-0'} ${className}`} style={{ minHeight: adLoaded ? style.minHeight : '0px' }}>
      <div className="flex flex-col items-center justify-center relative overflow-hidden">
        {adLoaded && (
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-2">
            Publicidad
          </span>
        )}
        
        <ins className="adsbygoogle"
             style={{ display: adLoaded ? 'block' : 'none', minWidth: '250px', minHeight: adLoaded ? style.minHeight : '0px' }}
             data-ad-client={SITE_CONFIG.adsenseId}
             data-ad-slot={finalSlot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}
