'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { optimizeImageUrl } from '@/lib/data';

/**
 * PremiumImage — Componente de imagen ultra-robusto para Imperio Público.
 * Estrategia de carga:
 *   1. Cloudinary/Unsplash → next/image optimizado (CDN instantáneo)
 *   2. Cualquier URL externa → /api/proxy-image (bypassea hotlink protection)
 *   3. Si el proxy falla → imagen de fallback de categoría (Unsplash, siempre disponible)
 * 
 * NUNCA muestra el placeholder roto de "imagen no encontrada".
 */

const FALLBACKS = {
  deportes:        'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=1200&auto=format&fit=crop',
  economia:        'https://images.unsplash.com/photo-1611974714851-eb60516746e3?q=80&w=1200&auto=format&fit=crop',
  internacional:   'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=1200&auto=format&fit=crop',
  entretenimiento: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop',
  sucesos:         'https://images.unsplash.com/photo-1563206767-5b18f218e7de?q=80&w=1200&auto=format&fit=crop',
  tecnologia:      'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1200&auto=format&fit=crop',
  salud:           'https://images.unsplash.com/photo-1505751172107-573225a91200?q=80&w=1200&auto=format&fit=crop',
  cultura:         'https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=1200&auto=format&fit=crop',
  politica:        'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1200&auto=format&fit=crop',
  noticias:        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop',
  opinion:         'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
  tendencias:      'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=1200&auto=format&fit=crop',
  default:         'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop',
};

function getFallback(category) {
  return FALLBACKS[(category || '').toLowerCase()] || FALLBACKS.default;
}

/**
 * Determina si una URL debe ir directamente a next/image (CDN propio)
 * o via nuestro proxy de imágenes externas.
 */
function resolveDisplaySrc(src, category, width) {
  // SIEMPRE devuelve { url, mode } — nunca un string
  if (!src) return { url: getFallback(category), mode: 'img' };

  const optimized = optimizeImageUrl(src, width);
  if (!optimized) return { url: getFallback(category), mode: 'img' };
  
  const safe = optimized.startsWith('http://') ? optimized.replace('http://', 'https://') : optimized;

  // Cloudinary y Unsplash: CDN directo, siempre disponible
  if (safe.includes('cloudinary.com') || safe.includes('unsplash.com')) {
    return { url: safe, mode: 'next-image' };
  }

  // Pollinations.ai: CDN de IA, también accesible directamente
  if (safe.includes('pollinations.ai') || safe.includes('image.pollinations.ai')) {
    return { url: safe, mode: 'img' };
  }

  // Cualquier otra URL externa → nuestro proxy
  if (safe.startsWith('http')) {
    return { url: `/api/proxy-image?url=${encodeURIComponent(safe)}`, mode: 'img' };
  }

  // URLs relativas, /icon.png, etc.
  return { url: safe || getFallback(category), mode: 'img' };
}

export default function PremiumImage({
  src,
  alt,
  category = '',
  className = '',
  containerClassName = '',
  priority = false,
  width = 1200,
}) {
  const fallback = getFallback(category);
  const resolved = resolveDisplaySrc(src, category, width);

  // Estado: null = cargando, true = cargado, false = error → usar fallback
  const [status, setStatus] = useState(null);
  const [currentSrc, setCurrentSrc] = useState(resolved.url);
  const [mode, setMode] = useState(resolved.mode);
  const timeoutRef = useRef(null);

  // Reset cuando cambia el src (navegación entre artículos)
  useEffect(() => {
    const r = resolveDisplaySrc(src, category, width);
    setCurrentSrc(r.url);
    setMode(r.mode);
    setStatus(null);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timeout de seguridad: si la imagen tarda más de 12s → mostrar fallback de categoría
  useEffect(() => {
    if (status !== null) return; // ya cargó o ya falló
    timeoutRef.current = setTimeout(() => {
      setCurrentSrc(fallback);
      setMode('img');
      setStatus(null); // reinicia para que el fallback intente cargar
    }, 12000);
    return () => clearTimeout(timeoutRef.current);
  }, [status, fallback]);

  const handleLoad = () => {
    clearTimeout(timeoutRef.current);
    setStatus(true);
  };

  const handleError = () => {
    clearTimeout(timeoutRef.current);
    const safeCurrent = currentSrc || '';
    // Si el proxy falló, intentamos directamente con la URL original
    if (safeCurrent.includes('/api/proxy-image')) {
      try {
        const originalUrl = new URL(safeCurrent, 'https://x.com').searchParams.get('url');
        if (originalUrl) {
          setCurrentSrc(originalUrl);
          setMode('img');
          setStatus(null);
          return;
        }
      } catch (_) { /* ignore */ }
    }
    // Si ya estamos en el fallback de categoría y aún falla → no hacer nada más
    if (safeCurrent === fallback) {
      setStatus(true);
      return;
    }
    // En cualquier otro caso → fallback de categoría (Unsplash, siempre disponible)
    setCurrentSrc(fallback);
    setMode('img');
    setStatus(null);
  };

  const isCloudinary = (currentSrc || '').includes('cloudinary.com');

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${containerClassName}`}>

      {/* Skeleton animado mientras carga */}
      {status === null && (
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
      )}

      {/* Imagen principal */}
      {mode === 'next-image' ? (
        <Image
          src={currentSrc}
          alt={alt || 'Noticia'}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${status ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          unoptimized={isCloudinary}
        />
      ) : (
        <img
          src={currentSrc || fallback}
          alt={alt || 'Noticia'}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${status ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  );
}
