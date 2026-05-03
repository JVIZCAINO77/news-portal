// app/layout.js — Root Layout para Imperio Público 2.0
import './globals.css';
import { SITE_CONFIG } from '@/lib/data';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';
import BackToTop from '@/components/BackToTop';
import { Analytics } from '@vercel/analytics/react';
import GoogleAnalytics from '@/components/GoogleAnalytics';
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
  keywords: ['noticias', 'dominicana', 'actualidad', 'internacionales', 'deportes', 'economía', 'tecnología', 'imperio público'],
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
        
        {/* RSS Feed autodiscovery */}
        <link rel="alternate" type="application/rss+xml" title={`${SITE_CONFIG.name} — Últimas Noticias`} href="/feed.xml" />
        
        {/* Google AdSense Script */}
        <Script 
          async 
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE_CONFIG.adsenseId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <meta name="google-adsense-account" content={SITE_CONFIG.publisherId} />
        {/* Google Analytics 4 */}
        <Suspense fallback={null}>
          <GoogleAnalytics gaId={SITE_CONFIG.gaId} />
        </Suspense>
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Header />
        <div className="min-h-screen pb-24 md:pb-0" style={{ paddingTop: '2px' }}>
          {children}
        </div>
        <BackToTop />
        <Footer />
        <CookieConsent />
        <Analytics />
      </body>
    </html>
  );
}
