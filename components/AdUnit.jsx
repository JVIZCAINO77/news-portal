// components/AdUnit.jsx — Espacio publicitario con reserva de espacio (CLS Prevention)
'use client';
import { useEffect, useState } from 'react';
import { SITE_CONFIG } from '@/lib/data';

export default function AdUnit({ slot, format = 'rectangle', className = '' }) {
  const [adLoaded, setAdLoaded] = useState(false);

  // Si los anuncios globales están apagados, esconder silenciosamente este componente
  if (!SITE_CONFIG.showAds) return null;

  // Dimensiones estándar de anuncios
  const dimensions = {
    leaderboard: { minHeight: '0px', width: '100%', label: '728 x 90' },
    rectangle: { minHeight: '0px', width: '100%', label: '300 x 250' },
    'in-article': { minHeight: '0px', width: '100%', label: 'Native / In-Article' },
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
    <div className={`ad-container ${adLoaded ? 'my-4' : 'my-0'} ${className}`} style={{ minHeight: adLoaded ? style.minHeight : '0px' }}>
      <div className="flex flex-col items-center justify-center relative overflow-hidden">
        {/* Visual placeholder removed to improve aesthetic before ad loads */}
        
        <ins className="adsbygoogle"
             style={{ display: adLoaded ? 'block' : 'none', minWidth: '250px', minHeight: adLoaded ? style.minHeight : '0px' }}
             data-ad-client={SITE_CONFIG.adsenseId}
             data-ad-slot={slot}
             data-ad-format="auto"
             data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
}
