/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Optimización de imágenes ─────────────────────────────────────────────
  images: {
    // Formatos modernos: AVIF primero (40% más pequeño), WebP como fallback
    formats: ['image/avif', 'image/webp'],
    // Cachear imágenes optimizadas por 30 días
    minimumCacheTTL: 2592000,
    // Tamaños de dispositivo para responsive images
    deviceSizes: [390, 768, 1024, 1280],
    imageSizes: [16, 48, 96, 256],
    // ⚠️ SOLO dominios que controlamos directamente.
    // Los dominios externos de noticias (.com.do) deben ser
    // internalizados a Cloudinary por el bot antes de publicar.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      // Fallback temporal para fuentes dominicanas — eliminar una vez 100% Cloudinary
      { protocol: 'https', hostname: '**.diariolibre.com' },
      { protocol: 'https', hostname: '**.almomento.net' },
    ],
  },
  // ─── Compresión HTTP ──────────────────────────────────────────────────────
  compress: true,
  // Nota: optimizeFonts está habilitado por defecto en Next.js 13+ y no necesita configuración explícita
  async headers() {
    return [
      {
        source: '/robots.txt',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/sitemap.xml',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      {
        source: '/news-sitemap.xml',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=1800, stale-while-revalidate=3600' }],
      },
      {
        source: '/ads.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=604800, immutable' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // ─── Iconos y assets estáticos — caché máximo ─────────────────────────
      {
        source: '/:file(favicon|icon|logo|og-image)(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // ─── Assets Next.js estáticos — inmutables (solo producción) ─────────────
      // Nota: en dev Next.js gestiona su propio Cache-Control para /_next/static
      ...( process.env.NODE_ENV === 'production' ? [{
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      }] : []),
      // ─── Cabeceras de Seguridad HTTP para todas las rutas ─────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
