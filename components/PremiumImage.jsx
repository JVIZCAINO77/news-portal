'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { optimizeImageUrl } from '@/lib/data';

/**
 * PremiumImage — Componente de imagen ultra-robusto y optimizado para velocidad.
 * PRIORIDAD: Carga instantánea y fidelidad visual.
 */
export default function PremiumImage({ 
  src, 
  alt, 
  category = "",
  className = "", 
  containerClassName = "", 
  priority = false,
  width = 1200
}) {
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [proxyFailed, setProxyFailed] = useState(false);
  const timeoutRef = useRef(null);

  // Fallbacks estéticos
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
  
  // Optimizamos la URL de origen
  const optimizedSrc = optimizeImageUrl(src || currentFallback, width);
  const tinyBlurSrc = optimizeImageUrl(src || currentFallback, 40);
  
  // Forzamos HTTPS
  const safeSrc = optimizedSrc.startsWith('http://') ? optimizedSrc.replace('http://', 'https://') : optimizedSrc;
  
  // Solo optimizamos con next/image dominios controlados
  const shouldOptimize = (url) => {
    if (!url) return false;
    return url.includes('cloudinary.com') || url.includes('unsplash.com');
  };

  const useNextImage = shouldOptimize(safeSrc);
  const isCloudinary = safeSrc.includes('cloudinary.com');

  // Cascada de fuentes:
  // 1º) Cloudinary / Unsplash → next/image optimizado
  // 2º) Cualquier URL externa → nuestro proxy (/api/proxy-image)
  // 3º) Si el proxy falló → URL original directa (el browser sí puede cargarla)
  // 4º) Si todo falló → fallback estético por categoría
  const displaySrc = (isError || timedOut)
    ? currentFallback
    : proxyFailed && safeSrc?.startsWith('http') && !safeSrc.includes('pollinations.ai')
      ? safeSrc  // Intento 3: URL original directa en el browser
      : !useNextImage && safeSrc?.startsWith('http') && !safeSrc.includes('pollinations.ai')
        ? `/api/proxy-image?url=${encodeURIComponent(safeSrc)}` // Intento 2: proxy
        : (safeSrc || currentFallback); // Intento 1: Cloudinary/Unsplash directo

  // Reset all state when the image source changes (e.g. navigating between articles)
  useEffect(() => {
    setIsError(false);
    setIsLoaded(false);
    setTimedOut(false);
    setProxyFailed(false);
  }, [src]);

  // Timeout de seguridad reducido a 8s para mejor UX
  useEffect(() => {
    if (!isLoaded && !isError) {
      timeoutRef.current = setTimeout(() => {
        if (!isLoaded) {
          setTimedOut(true);
        }
      }, 8000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isLoaded, isError]);

  return (
    <div className={`relative overflow-hidden bg-gray-50 ${containerClassName}`}>
      
      {/* 1. Blur Background (Carga ultra-rápida con tiny miniatura) */}
      {!isError && !timedOut && (
        <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-60 blur-3xl scale-110">
          <img 
            src={tinyBlurSrc} 
            alt="" 
            className="w-full h-full object-cover" 
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>
      )}

      {/* 2. Skeleton animado (Solo visible si el blur tarda) */}
      {!isLoaded && !isError && !timedOut && (
        <div className="absolute inset-0 z-[1] bg-gray-200/50 animate-pulse flex items-center justify-center">
           <div className="w-8 h-8 border-2 border-red-500/20 border-t-red-600 rounded-full animate-spin"></div>
        </div>
      )}

      {/* 3. Imagen Principal o Fallback Premium */}
      {(isError || timedOut) ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 border border-gray-100">
           <img 
            src={currentFallback} 
            alt="Fallback" 
            className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale blur-[2px]" 
           />
           <div className="relative z-20 flex flex-col items-center justify-center p-6 text-center w-full h-full">
              <div className="w-10 h-10 mb-4 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 shadow-sm">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-red-600/60 mb-2 font-sans">Imperio Público</span>
              <h3 className="text-gray-900/60 font-serif italic text-[11px] leading-snug max-w-[180px] line-clamp-2">{alt}</h3>
           </div>
        </div>
      ) : (
        <>
          {useNextImage ? (
            <Image 
              src={displaySrc} 
              alt={alt || "Noticia"} 
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} ${className}`} 
              onLoad={() => setIsLoaded(true)}
              onError={() => setIsError(true)}
              unoptimized={isCloudinary}
            />
          ) : (
            <img 
              src={displaySrc} 
              alt={alt || "Noticia"} 
              className={`absolute inset-0 w-full h-full object-contain transition-all duration-700 ${isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} ${className}`} 
              onLoad={() => setIsLoaded(true)}
              onError={() => {
                if (!useNextImage && !proxyFailed && !isError) {
                  setProxyFailed(true);
                } else {
                  setIsError(true);
                }
              }}
              loading={priority ? "eager" : "lazy"}
            />
          )}
        </>
      )}
    </div>
  );
}

