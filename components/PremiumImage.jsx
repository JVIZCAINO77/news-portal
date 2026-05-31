'use client';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { optimizeImageUrl } from '@/lib/data';

/**
 * PremiumImage — Componente de imagen ultra-robusto para Imperio Público.
 *
 * Estrategia de renderizado:
 *   - Cloudinary  → <img> directo con src de Cloudinary (optimizado en la URL misma)
 *   - Unsplash    → <Image> de Next.js (optimización AVIF automática)
 *   - Externa     → /api/proxy-image (bypassea hotlink protection)
 *   - Pollinations → <img> directo
 *
 * Fallback: onError → imagen de categoría de Unsplash (siempre accesible).
 * NUNCA muestra placeholder roto.
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

/**
 * Determina la URL final y el modo de renderizado.
 *
 * mode: 'img'        → <img> nativo (Cloudinary, Pollinations, proxy, fallback)
 *       'next-image' → <Image> de Next.js (solo Unsplash — optimización AVIF)
 */
function resolveDisplaySrc(src, category, width) {
  if (!src) return { url: getFallback(category), mode: 'img' };

  const optimized = optimizeImageUrl(src, width);
  if (!optimized) return { url: getFallback(category), mode: 'img' };

  const safe = optimized.startsWith('http://')
    ? optimized.replace('http://', 'https://')
    : optimized;

  // Cloudinary → <img> directo (URL ya lleva f_auto,q_auto,w_ en optimizeImageUrl)
  // SIN pasar por next/image para evitar el doble-proxy de Vercel
  if (safe.includes('cloudinary.com')) {
    return { url: safe, mode: 'img' };
  }

  // Unsplash → next/image (AVIF/WebP automático, excelente caché)
  if (safe.includes('unsplash.com')) {
    return { url: safe, mode: 'next-image' };
  }

  // Pollinations AI → <img> directo
  if (safe.includes('pollinations.ai')) {
    return { url: safe, mode: 'img' };
  }

  // Cualquier otra URL externa → proxy para evitar bloqueos CORS/hotlink
  if (safe.startsWith('http')) {
    return { url: `/api/proxy-image?url=${encodeURIComponent(safe)}`, mode: 'img' };
  }

  return { url: getFallback(category), mode: 'img' };
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

  // priority=true → visible de inmediato (LCP optimizado)
  // priority=false → skeleton hasta onLoad
  const [status, setStatus] = useState(priority ? true : null);
  const [currentSrc, setCurrentSrc] = useState(resolved.url);
  const [mode, setMode]       = useState(resolved.mode);
  const prevSrcRef = useRef(src);

  // Aplicar la nueva resolución cuando cambia src (sin setState síncrono en el cuerpo del efecto)
  useEffect(() => {
    if (src === prevSrcRef.current) return;
    prevSrcRef.current = src;
    const r = resolveDisplaySrc(src, category, width);
    setCurrentSrc(r.url);
    setMode(r.mode);
    setStatus(priority ? true : null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Safety timeout: elimina el skeleton después de 20s si ni onLoad ni onError llegaron
  // (edge case: imágenes cuyo evento de carga nunca dispara)
  useEffect(() => {
    if (status !== null) return;
    const t = setTimeout(() => setStatus(true), 20000);
    return () => clearTimeout(t);
  }, [status]);

  const handleLoad = () => setStatus(true);

  const handleError = () => {
    const cur = currentSrc || '';
    if (cur === fallback) { setStatus(true); return; }
    // Primer fallo → ir al fallback de categoría (Unsplash, siempre accesible)
    setCurrentSrc(fallback);
    setMode('next-image');
    setStatus(true);
  };

  // Clases CSS compartidas para <img> y <Image>
  const imgClass = [
    'absolute inset-0 w-full h-full',
    priority
      ? ''
      : `transition-opacity duration-500 ${status ? 'opacity-100' : 'opacity-0'}`,
    className,
  ].filter(Boolean).join(' ');

  // Responsive sizes
  const imgSizes =
    width >= 1200
      ? '(max-width: 390px) 390px, (max-width: 768px) 100vw, (max-width: 1280px) 50vw, 1200px'
      : width >= 800
      ? '(max-width: 390px) 390px, (max-width: 768px) 100vw, (max-width: 1280px) 50vw, 800px'
      : '(max-width: 390px) 200px, (max-width: 768px) 50vw, 400px';

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${containerClassName}`}>

      {/* Skeleton — solo para imágenes no-priority mientras cargan */}
      {status === null && (
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
      )}

      {mode === 'next-image' ? (
        /* Solo Unsplash usa next/image — optimización AVIF automática */
        <Image
          src={currentSrc}
          alt={alt || 'Noticia'}
          fill
          priority={priority}
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={imgSizes}
          className={imgClass}
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : (
        /* Cloudinary, proxy, Pollinations → <img> nativo con srcset responsivo */
        (() => {
          // Generar srcset solo para Cloudinary — otros CDN no soportan transforms on-the-fly
          const isCloudinary = currentSrc?.includes('cloudinary.com');
          const srcset = isCloudinary
            ? [
                optimizeImageUrl(src, 480)  + ' 480w',
                optimizeImageUrl(src, 768)  + ' 768w',
                optimizeImageUrl(src, 1024) + ' 1024w',
                optimizeImageUrl(src, 1200) + ' 1200w',
              ].join(', ')
            : undefined;
          return (
            <img
              src={currentSrc || fallback}
              alt={alt || 'Noticia'}
              width={width}
              height={Math.round(width * 0.5625)}
              className={imgClass}
              onLoad={handleLoad}
              onError={handleError}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              decoding={priority ? 'sync' : 'async'}
              crossOrigin="anonymous"
              {...(srcset ? { srcSet: srcset, sizes: imgSizes } : {})}
            />
          );
        })()
      )}
    </div>
  );
}
