
'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { optimizeImageUrl } from '@/lib/data';

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
  const displaySrc = isError ? currentFallback : src;

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${containerClassName}`}>
      
      {/* Skeleton / Placeholder */}
      {!isLoaded && !isError && (
        <div className="absolute inset-0 z-0 bg-slate-800 animate-pulse" />
      )}

      {/* Efecto de fondo difuminado (solo si cargó y no es error) */}
      {isLoaded && !isError && (
        <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-40 blur-3xl scale-125">
          <Image 
            src={displaySrc} 
            alt="" 
            fill
            className="object-cover"
            sizes="10vw"
            quality={10}
          />
        </div>
      )}

      {/* Imagen Principal u Overlay de Error */}
      {isError ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900">
           <Image 
            src={currentFallback} 
            alt="Fallback" 
            fill
            className="object-cover opacity-40 blur-[2px]" 
           />
           <div className="relative z-20 flex flex-col items-center justify-center p-8 text-center bg-black/40 backdrop-blur-sm w-full h-full">
              <img src="/icon.png" alt="Logo IP" className="w-12 h-12 mb-3 grayscale brightness-200 opacity-60" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-red-500/80 mb-2">Imperio Público</span>
              <h3 className="text-white/60 font-serif italic text-sm leading-tight max-w-[200px] line-clamp-2">{alt}</h3>
           </div>
        </div>
      ) : (
        <Image 
          src={src || currentFallback} 
          alt={alt || "Noticia"} 
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`} 
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
        />
      )}
    </div>
  );
}

