'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
      <div className="max-w-4xl mx-auto bg-black text-white p-6 md:p-8 shadow-2xl border border-white/10 rounded-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-3 text-red-600">Aviso de Privacidad</h3>
            <p className="text-[13px] font-serif leading-relaxed text-gray-300">
              En <strong className="text-white italic">Imperio Público</strong> utilizamos cookies propias y de terceros (como Google AdSense) para mejorar tu experiencia y mostrarte publicidad personalizada. 
              Al continuar navegando, aceptas nuestra <Link href="/privacidad" className="underline hover:text-red-500 transition-colors">Política de Privacidad</Link> y el uso de estas tecnologías.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <button
              onClick={acceptCookies}
              className="bg-red-600 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
            >
              Aceptar y Continuar
            </button>
            <Link
              href="/privacidad"
              className="border border-white/20 text-white px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-center"
            >
              Saber más
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
