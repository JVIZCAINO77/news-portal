/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Optimización de imágenes ─────────────────────────────────────────────
  images: {
    // Formatos modernos: AVIF primero (40% más pequeño), WebP como fallback
    formats: ['image/avif', 'image/webp'],
    // Cachear imágenes optimizadas por 30 días
    minimumCacheTTL: 2592000,
    // Tamaños de dispositivo para responsive images
    deviceSizes: [390, 414, 768, 1024, 1280, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'image.pollinations.ai' },
      { protocol: 'https', hostname: 'pollinations.ai' },
      { protocol: 'https', hostname: 'remolacha.net' },
      { protocol: 'https', hostname: 'almomento.net' },
      { protocol: 'https', hostname: 'www.almomento.net' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      // Fuentes dominicanas nuevas
      { protocol: 'https', hostname: '**.diariolibre.com' },
      { protocol: 'https', hostname: '**.acento.com.do' },
      { protocol: 'https', hostname: '**.hoy.com.do' },
      { protocol: 'https', hostname: '**.elcaribe.com.do' },
      { protocol: 'https', hostname: '**.cdn.com.do' },
      { protocol: 'https', hostname: '**.elnacional.com.do' },
      { protocol: 'https', hostname: '**.noticiassin.com' },
      { protocol: 'https', hostname: '**.elnuevodiario.com.do' },
      { protocol: 'https', hostname: '**.z101digital.com' },
      // Fuentes internacionales
      { protocol: 'https', hostname: '**.cnn.com' },
      { protocol: 'https', hostname: '**.bbc.com' },
      { protocol: 'https', hostname: '**.france24.com' },
    ],
  },
  // ─── Compresión HTTP ──────────────────────────────────────────────────────
  compress: true,
  // ─── Optimización de fuentes ──────────────────────────────────────────────
  optimizeFonts: true,
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
      // ─── Fuentes Next.js — inmutables ─────────────────────────────────────
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
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
