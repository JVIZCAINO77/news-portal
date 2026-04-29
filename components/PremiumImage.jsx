
'use client';
import { useState, useEffect, useRef } from 'react';
import { optimizeImageUrl } from '@/lib/data';

/**
 * PremiumImage — Componente de imagen con manejo de errores, efecto de fondo difuminado
 * y sistema de fallback estético (Branded Fallback).
 */
export default function PremiumImage({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "", 
  blurOpacity = "0.4",
  blurScale = "1.1",
  priority = false,
  width = 1200 // Ancho sugerido para optimización
}) {
  // Aplicamos optimización a la URL inicial
  const optimizedSrc = optimizeImageUrl(src, width);
  const [imgSrc, setImgSrc] = useState(optimizedSrc);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(true);

  // Sincronizar si el src cambia externamente
  useEffect(() => {
    const newOptimized = optimizeImageUrl(src, width);
    setImgSrc(newOptimized);
    setIsError(false);
    setIsLoading(true);
    loadingRef.current = true;

    const timeout = setTimeout(() => {
      if (loadingRef.current) {
        console.warn(`[PremiumImage] Timeout: ${src}`);
        setIsError(true);
        setIsLoading(false);
        loadingRef.current = false;
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [src, width]);

  const handleError = () => {
    setIsError(true);
    setIsLoading(false);
    loadingRef.current = false;
  };

  const handleLoad = () => {
    setIsLoading(false);
    loadingRef.current = false;
  };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-zinc-900 ${containerClassName}`}>
      
      {/* 1. SKELETON / LOADING STATE */}
      {isLoading && (
        <div className="absolute inset-0 z-20 bg-slate-200 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* 2. BRANDED FALLBACK (Si hay error) */}
      {isError ? (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-slate-900 via-red-950 to-black flex flex-col items-center justify-center p-8 text-center">
          <div className="relative mb-4">
             <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20 animate-pulse"></div>
             <img src="/icon.png" alt="Imperio Público" className="w-20 h-20 object-contain relative z-10 opacity-50 grayscale contrast-125" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500/60 mb-2">Contenido no disponible</span>
          <h3 className="text-white/30 font-serif italic text-lg leading-tight max-w-xs">{alt}</h3>
        </div>
      ) : (
        <>
          {/* 3. CAPA DE FONDO DIFUMINADA (Solo si cargó bien) */}
          {!isLoading && imgSrc && (
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
              <img 
                src={imgSrc} 
                className="w-full h-full object-cover blur-3xl scale-125 opacity-30" 
                alt="" 
                aria-hidden="true"
              />
            </div>
          )}

          {/* 4. IMAGEN PRINCIPAL */}
          {imgSrc && (
            <img 
              src={imgSrc} 
              alt={alt} 
              className={`relative z-10 transition-all duration-1000 ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} ${className}`} 
              onError={handleError}
              onLoad={handleLoad}
              loading={priority ? "eager" : "lazy"}
            />
          )}
        </>
      )}
    </div>
  );
}
