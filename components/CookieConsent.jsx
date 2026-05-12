'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Pequeño delay para no bloquear el LCP
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'all');
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential');
    setShowBanner(false);
    // Cuando rechaza cookies publicitarias, intentamos deshabilitar anuncios personalizados
    if (typeof window !== 'undefined' && window.googletag) {
      try {
        window.googletag.pubads().setRequestNonPersonalizedAds(1);
      } catch (_) {}
    }
  };

  if (!showBanner) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-3 md:p-5"
    >
      <div className="max-w-5xl mx-auto bg-black text-white shadow-2xl border border-white/10 rounded-sm">
        <div className="p-5 md:p-7">
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            {/* Texto */}
            <div className="flex-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] mb-2 text-red-500">
                🍪 Aviso de Privacidad y Cookies
              </h3>
              <p className="text-[13px] font-serif leading-relaxed text-gray-300">
                Usamos cookies propias y de terceros (incluyendo <strong className="text-white">Google AdSense</strong> y <strong className="text-white">Google Analytics</strong>) para mejorar tu experiencia y mostrar publicidad relevante. Puedes elegir entre aceptar todas las cookies o solo las esenciales.{' '}
                <Link href="/privacidad" className="underline hover:text-red-400 transition-colors whitespace-nowrap">
                  Más información
                </Link>
              </p>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {/* Rechazar / Solo esenciales */}
              <button
                onClick={acceptEssential}
                id="cookie-reject-btn"
                className="border border-white/30 text-white/80 px-5 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-center rounded-sm"
              >
                Solo Esenciales
              </button>
              {/* Aceptar todo */}
              <button
                onClick={acceptAll}
                id="cookie-accept-btn"
                className="bg-red-600 text-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all rounded-sm"
              >
                Aceptar Todas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
