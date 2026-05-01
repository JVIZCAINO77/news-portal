
'use client';
import { useState, useEffect, useRef } from 'react';
import { optimizeImageUrl } from '@/lib/data';

/**
 * PremiumImage — Componente de imagen con manejo de errores, efecto de fondo difuminado
 * y sistema de fallback estético (Branded Fallback).
 *
 * NOTA: El timeout fue eliminado porque causaba falsos positivos en móvil:
 * cuando hay muchas imágenes lazy en cola, el browser las carga secuencialmente
 * y el timeout de 15s expiraba antes de que el browser intentara la imagen.
 * El onError nativo es suficiente para detectar fallos reales.
 */
export default function PremiumImage({ 
  src, 
  alt, 
  category = "",
  className = "", 
  containerClassName = "", 
  blurOpacity = "0.4",
  blurScale = "1.1",
  priority = false,
  width = 1200
}) {
  const optimizedSrc = optimizeImageUrl(src, width);
  const [imgSrc, setImgSrc] = useState(optimizedSrc);
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const newOptimized = optimizeImageUrl(src, width);
    setImgSrc(newOptimized);
    setIsError(false);
    setIsLoaded(false);

    // Check if image is already complete (cached)
    if (imgRef.current && imgRef.current.complete) {
      handleLoad();
    }
  }, [src, width]);

  const handleError = () => {
    console.error(`PremiumImage: Failed to load image: ${imgSrc}`);
    setIsError(true);
    setIsLoaded(false);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const FALLBACKS = {
    deportes: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1000&auto=format&fit=crop',
    economia: 'https://images.unsplash.com/photo-1611974714851-eb60516746e3?q=80&w=1000&auto=format&fit=crop',
    internacional: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1000&auto=format&fit=crop',
    entretenimiento: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000&auto=format&fit=crop',
    sucesos: 'https://images.unsplash.com/photo-1563206767-5b18f218e7de?q=80&w=1000&auto=format&fit=crop',
    tecnologia: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1000&auto=format&fit=crop',
    salud: 'https://images.unsplash.com/photo-1505751172107-573225a91200?q=80&w=1000&auto=format&fit=crop',
    cultura: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1000&auto=format&fit=crop',
    default: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop'
  };

  const currentFallback = FALLBACKS[category.toLowerCase()] || FALLBACKS.default;

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-zinc-900 ${containerClassName}`}>
      
      {!isLoaded && !isError && (
        <div className="absolute inset-0 z-0 bg-slate-200 dark:bg-zinc-800 animate-pulse" />
      )}

      {isError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
           <img 
            src={currentFallback} 
            alt="Fallback" 
            className="absolute inset-0 w-full h-full object-cover opacity-40 blur-[2px]" 
           />
           <div className="relative z-20 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-sm w-full h-full">
              <div className="relative mb-3">
                 <div className="absolute inset-0 bg-red-600 blur-2xl opacity-20"></div>
                 <img src="/icon.png" alt="Logo" className="w-12 h-12 object-contain relative z-10 opacity-60 grayscale brightness-200" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-red-500/80 mb-2">Imperio Público</span>
              <h3 className="text-white/60 font-serif italic text-sm leading-tight max-w-[200px] line-clamp-2">{alt}</h3>
           </div>
        </div>
      ) : (
        <>
          {isLoaded && imgSrc && (
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
              <img 
                src={imgSrc} 
                className="w-full h-full object-cover blur-3xl scale-125 opacity-60" 
                alt="" 
                aria-hidden="true"
              />
            </div>
          )}

          {imgSrc && (
            <img 
              ref={imgRef}
              src={imgSrc} 
              alt={alt} 
              className={`relative z-10 transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`} 
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

