// app/layout.js — Root Layout para PulsoNoticias 2.0
import './globals.css';
import { SITE_CONFIG } from '@/lib/data';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Analytics } from '@vercel/analytics/react';
import Script from 'next/script';

export const metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: `${SITE_CONFIG.name} — El Pulso de la Actualidad`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: ['noticias', 'dominicana', 'actualidad', 'internacionales', 'deportes', 'economía', 'tecnología'],
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
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: SITE_CONFIG.name }],
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    creator: SITE_CONFIG.twitterHandle,
  },
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <meta name="google-adsense-account" content="ca-pub-9579937391435747" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Source+Serif+4:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
        
        {/* Google AdSense Script */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE_CONFIG.adsenseId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <meta name="google-adsense-account" content="ca-pub-9579937391435747" />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
