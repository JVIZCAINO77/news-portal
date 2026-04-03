// components/AdSenseScript.jsx — Script de Google AdSense
'use client';
import Script from 'next/script';
import { SITE_CONFIG } from '@/lib/data';

export default function AdSenseScript() {
  if (!SITE_CONFIG.adsenseId || SITE_CONFIG.adsenseId.includes('XXXXX')) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE_CONFIG.adsenseId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
