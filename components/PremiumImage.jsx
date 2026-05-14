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
  deportes:        'https://images.unsplash.com/photo-1546519638-68e109498ffc?q=80&w=1200&auto=format&fit=crop',
  economia:        'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
  internacional:   'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
  entretenimiento: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop',
  sucesos:         'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1200&auto=format&fit=crop',
  tecnologia:      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
  salud:           'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=1200&auto=format&fit=crop',
  cultura:         'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=1200&auto=format&fit=crop',
  politica:        'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1200&auto=format&fit=crop',
  noticias:        'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&auto=format&fit=crop',
  opinion:         'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop',
  tendencias:      'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1200&auto=format&fit=crop',
  policia:         'https://images.unsplash.com/photo-1453873531674-2151bcd01707?q=80&w=1200&auto=format&fit=crop',
  default:         'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&auto=format&fit=crop',
};

function getFallback(category) {
  return FALLBACKS[(category || '').toLowerCase()] || FALLBACKS.default;
}

function resolveDisplaySrc(src, category, width) {
  if (!src) return { url: getFallback(category), mode: 'img' };

  const optimized = optimizeImageUrl(src, width);
  if (!optimized) return { url: getFallback(category), mode: 'img' };

  const safe = optimized.startsWith('http://') ? optimized.replace('http://', 'https://') : optimized;

  if (safe.includes('cloudinary.com') || safe.includes('unsplash.com')) {
    return { url: safe, mode: 'next-image' };
  }

  if (safe.includes('pollinations.ai') || safe.includes('image.pollinations.ai')) {
    return { url: safe, mode: 'img' };
  }

  if (safe.startsWith('http')) {
    return { url: `/api/proxy-image?url=${encodeURIComponent(safe)}`, mode: 'img' };
  }

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

  // CLAVE LCP: Imágenes priority empiezan visibles (status=true) para evitar
  // el "retraso de renderizado" de 2s que provoca el LCP alto.
  // Imágenes lazy usan skeleton (status=null) hasta que cargan.
  const [status, setStatus] = useState(priority ? true : null);
  const [currentSrc, setCurrentSrc] = useState(resolved.url);
  const [mode, setMode] = useState(resolved.mode);
  const timeoutRef = useRef(null);
  // Guardamos la última src procesada para evitar resets innecesarios
  const prevSrcRef = useRef(src);

  useEffect(() => {
    if (src === prevSrcRef.current) return; // misma URL → no resetear
    prevSrcRef.current = src;
    const r = resolveDisplaySrc(src, category, width);
    setCurrentSrc(r.url);
    setMode(r.mode);
    setStatus(null); // Solo resetea si realmente cambió la imagen
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timeout de 3s — si la imagen no carga, mostrar fallback de categoría
  useEffect(() => {
    if (status !== null) return;
    timeoutRef.current = setTimeout(() => {
      setCurrentSrc(fallback);
      setMode('next-image'); // Usar next/image para el fallback (optimización AVIF)
      setStatus(true);
    }, 3000);
    return () => clearTimeout(timeoutRef.current);
  }, [status, fallback]);

  const handleLoad = () => {
    clearTimeout(timeoutRef.current);
    setStatus(true);
  };

  const handleError = () => {
    clearTimeout(timeoutRef.current);
    const safeCurrent = currentSrc || '';
    // Si ya estamos mostrando el fallback, no hacer nada más
    if (safeCurrent === fallback) {
      setStatus(true);
      return;
    }
    // Ir directamente al fallback de categoría (no reintentar la URL original
    // porque si el proxy falló, la URL original tampoco cargará)
    setCurrentSrc(fallback);
    setMode('next-image');
    setStatus(true);
  };

  const isCloudinary = (currentSrc || '').includes('cloudinary.com');

  // Responsive sizes según el ancho solicitado
  const imgSizes = width >= 1200
    ? '(max-width: 390px) 390px, (max-width: 768px) 100vw, (max-width: 1280px) 50vw, 1200px'
    : width >= 800
    ? '(max-width: 390px) 390px, (max-width: 768px) 100vw, (max-width: 1280px) 50vw, 800px'
    : '(max-width: 390px) 200px, (max-width: 768px) 50vw, 400px';

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${containerClassName}`}>

      {/* Skeleton — solo para imágenes lazy (no priority) */}
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
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={imgSizes}
          className={`absolute inset-0 w-full h-full object-contain ${priority ? '' : `transition-opacity duration-300 ${status ? 'opacity-100' : 'opacity-0'}`} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          unoptimized={isCloudinary}
        />
      ) : (
        <img
          src={currentSrc || fallback}
          alt={alt || 'Noticia'}
          width={width}
          height={Math.round(width * 0.5625)}
          className={`absolute inset-0 w-full h-full object-contain ${priority ? '' : `transition-opacity duration-300 ${status ? 'opacity-100' : 'opacity-0'}`} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
        />
      )}
    </div>
  );
}


