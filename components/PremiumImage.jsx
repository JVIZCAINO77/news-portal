
'use client';
import { useState, useEffect } from 'react';

const DEFAULT_PLACEHOLDER = '/icon.png';

/**
 * PremiumImage — Componente de imagen con manejo de errores y efecto de fondo difuminado.
 * Ideal para portadas y tarjetas donde la imagen es central.
 */
export default function PremiumImage({ 
  src, 
  alt, 
  className = "", 
  containerClassName = "", 
  blurOpacity = "0.4",
  blurScale = "1.1",
  priority = false
}) {
  const [imgSrc, setImgSrc] = useState(src || DEFAULT_PLACEHOLDER);
  const [isError, setIsError] = useState(false);

  // Sincronizar si el src cambia externamente
  useEffect(() => {
    setImgSrc(src || DEFAULT_PLACEHOLDER);
    setIsError(false);
  }, [src]);

  const handleError = () => {
    if (!isError) {
      setImgSrc(DEFAULT_PLACEHOLDER);
      setIsError(true);
    }
  };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-slate-900 ${containerClassName}`}>
      {/* Capa de fondo difuminada (solo si no es error y no es el placeholder por defecto) */}
      {!isError && imgSrc !== DEFAULT_PLACEHOLDER && (
        <div className="absolute inset-0 z-0">
          <img 
            src={imgSrc} 
            className={`w-full h-full object-cover blur-3xl opacity-[${blurOpacity}] scale-[${blurScale}]`} 
            alt="" 
            aria-hidden="true"
          />
        </div>
      )}

      {/* Imagen Principal */}
      <img 
        src={imgSrc} 
        alt={alt} 
        className={`relative z-10 ${className}`} 
        onError={handleError}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
}
