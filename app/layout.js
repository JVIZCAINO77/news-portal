// app/layout.js — Root Layout para Imperio Público 2.0
import './globals.css';
import { SITE_CONFIG } from '@/lib/data';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import BackToTop from '@/components/BackToTop';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import PushSubscribeButton from '@/components/PushSubscribeButton';
import Script from 'next/script';
import { Inter, Playfair_Display } from 'next/font/google';
import { Suspense } from 'react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
});

export const metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} — La Autoridad de la Actualidad`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: ['noticias dominicanas', 'noticias república dominicana', 'actualidad dominicana', 'noticias rdo', 'noticias hoy', 'internacionales', 'deportes', 'economía dominicana', 'tecnología', 'política dominicana', 'sucesos', 'policia', 'entretenimiento', 'imperio público', 'imperiopublico', 'noticias en vivo'],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.name,
    description: SITE_CONFIG.description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
  },
  alternates: { canonical: '/' },
  verification: {
    google: 'xrqiPZpt_gG6WjWPQNoeUdi1puP1ST_nfEh-Z1auCsY',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: SITE_CONFIG.name,
  },
  other: {
    // Verificación de cuenta Google AdSense
    'google-adsense-account': SITE_CONFIG.publisherId,
  },
};

export const viewport = {
  themeColor: '#bb1b21',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${inter.variable} ${playfair.variable}`}>
      <head>
        {/* Forzar modo claro antes de que React hidrate — evita el flash negro */}
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.remove('dark');localStorage.removeItem('theme');` }} />

        {/* ── Preconnect — críticos para LCP y recursos above-the-fold ── */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
        <link rel="preconnect" href={`https://${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '')}`} crossOrigin="anonymous" />
        {/* DNS prefetch para el resto (más barato, sin límite) */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        {/* Preload del logo — elemento LCP en mobile */}
        <link rel="preload" as="image" href="/icon.png" fetchPriority="high" />

        {/* RSS Feed autodiscovery */}
        <link rel="alternate" type="application/rss+xml" title={`${SITE_CONFIG.name} — Últimas Noticias`} href="/feed.xml" />

        {/* Google Analytics 4 */}
        <Suspense fallback={null}>
          <GoogleAnalytics gaId={SITE_CONFIG.gaId} />
        </Suspense>
        {/* JSON-LD — Identidad legal del medio (visible para crawlers de Google, invisible para lectores) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'NewsMediaOrganization',
              name: 'Imperio Público',
              legalName: 'Imperio Público',
              alternateName: 'imperiopublico.com',
              url: SITE_CONFIG.url,
              logo: `${SITE_CONFIG.url}/logo.png`,
              foundingDate: '2024',
              description: SITE_CONFIG.description,
              identifier: {
                '@type': 'PropertyValue',
                name: 'ONAPI — Certificado de Registro de Nombre Comercial',
                propertyID: 'Núm. de Registro',
                value: '931539',
              },
              founder: {
                '@type': 'Person',
                name: 'Jose Antonio Vizcaino Cuevas',
              },
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'DO',
                addressLocality: 'Santo Domingo',
                addressRegion: 'Distrito Nacional',
              },
              contactPoint: {
                '@type': 'ContactPoint',
                email: 'imperiopublico@gmail.com',
                contactType: 'editorial',
                availableLanguage: 'Spanish',
              },
              sameAs: [
                SITE_CONFIG.social?.facebook,
                SITE_CONFIG.social?.twitter,
                SITE_CONFIG.social?.instagram,
                SITE_CONFIG.social?.youtube,
              ].filter(Boolean),
            }),
          }}
        />
      </head>

      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Header />
        <div className="min-h-screen pb-24 md:pb-0" style={{ paddingTop: '2px' }}>
          {children}
        </div>
        <BackToTop />
        <Footer />
        <CookieConsent />
        {/* Push Notifications — genera audiencia recurrente */}
        <PushSubscribeButton />
        <Analytics />
        <SpeedInsights />
        {/* Service Worker para push + offline */}
        <Script
          id="register-sw"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
        {/* Google AdSense — fuera de <head> para que strategy=lazyOnload funcione correctamente */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE_CONFIG.adsenseId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
