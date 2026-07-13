/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Ocultar tecnología usada (info disclosure prevention) ──────────────────
  poweredByHeader: false,

  // ─── Optimización de imágenes ─────────────────────────────────────────────
  images: {
    // Formatos modernos: AVIF primero (40% más pequeño), WebP como fallback
    formats: ['image/avif', 'image/webp'],
    // Cachear imágenes optimizadas por 30 días
    minimumCacheTTL: 2592000,
    // Tamaños de dispositivo para responsive images
    deviceSizes: [390, 768, 1024, 1280],
    imageSizes: [16, 48, 96, 256],
    // SOLO dominios que controlamos. Todo lo demás pasa por <img> nativo en PremiumImage.
    // Eliminar dominios externos reduce invocaciones del optimizador de imágenes de Vercel.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
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
      // ─── Cabeceras de Seguridad HTTP para todas las rutas ───────────────
      {
        source: '/(.*)',
        headers: [
          // ─── HSTS: fuerza HTTPS, previene ataques MITM ──────────────────────
          // max-age=1 año. includeSubDomains protege subdominios. preload para HSTS preload list.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
          // ─── Content-Security-Policy ─────────────────────────────────────────
          {
            key: 'Content-Security-Policy',
            value: [
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://partner.googleadservices.com https://tpc.googlesyndication.com https://www.gstatic.com https://va.vercel-scripts.com https://vitals.vercel-insights.com blob:",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://pollinations.ai https://image.pollinations.ai https://www.google-analytics.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net",
              "connect-src 'self' https://*.supabase.co https://res.cloudinary.com https://api.cloudinary.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://pagead2.googlesyndication.com https://graph.facebook.com https://vitals.vercel-insights.com https://va.vercel-scripts.com",
              "frame-src 'self' https://pagead2.googlesyndication.com https://tpc.googlesyndication.com https://googleads.g.doubleclick.net https://bid.g.doubleclick.net",
              "child-src 'self' blob: https://pagead2.googlesyndication.com",
              "form-action 'self'",
              "worker-src 'self' blob:",
              // base-uri previene inyección de <base> tag (clickjacking via base tag)
              "base-uri 'self'",
              // upgrade-insecure-requests: fuerza HTTPS en recursos embebidos
              "upgrade-insecure-requests",
              "default-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
