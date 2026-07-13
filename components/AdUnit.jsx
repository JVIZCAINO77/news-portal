'use client';
// components/AdUnit.jsx — Espacios publicitarios sin espacio forzado cuando no hay anuncio
import { useEffect, useRef } from 'react';
import { SITE_CONFIG, ADS_SLOTS } from '@/lib/data';

export default function AdUnit({ slot, format = 'rectangle', className = '' }) {
  const finalSlot = ADS_SLOTS[slot] || slot;
  const isDev = process.env.NODE_ENV === 'development';
  const wrapperRef = useRef(null);
  const insRef = useRef(null);

  useEffect(() => {
    if (!SITE_CONFIG.showAds || isDev) return;

    const wrapper = wrapperRef.current;
    const ins = insRef.current;
    if (!wrapper || !ins) return;

    // Intentar inicializar AdSense
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}

    // Colapsar el wrapper si el anuncio no se rellena.
    // AdSense escribe data-ad-status="filled"|"unfilled" en el <ins>.
    const collapse = () => {
      wrapper.style.display = 'none';
      wrapper.style.height = '0';
      wrapper.style.overflow = 'hidden';
      wrapper.style.margin = '0';
      wrapper.style.padding = '0';
      wrapper.style.border = 'none';
    };

    const observer = new MutationObserver(() => {
      const status = ins.getAttribute('data-ad-status');
      if (status === 'unfilled') {
        collapse();
        observer.disconnect();
      } else if (status === 'filled') {
        observer.disconnect();
      }
    });

    observer.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });

    // Fallback: si en 3 segundos AdSense no respondió (bloqueado por CSP/adblocker)
    // y el <ins> sigue vacío (sin iframe hijo), colapsar también.
    const timer = setTimeout(() => {
      observer.disconnect();
      const status = ins.getAttribute('data-ad-status');
      const hasContent = ins.querySelector('iframe') !== null;
      if (!status || status === 'unfilled' || !hasContent) {
        collapse();
      }
    }, 3000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
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
  // El wrapper arranca visible; se colapsa en useEffect si el slot queda vacío.
  return (
    <div ref={wrapperRef} className={`ad-unit-wrapper ${className}`}>
      <ins
        ref={insRef}
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
