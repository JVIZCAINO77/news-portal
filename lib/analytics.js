// lib/analytics.js — Utilidades para Google Analytics 4 (Imperio Público)

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

/**
 * Eventos predefinidos para Imperio Público
 */
export const trackShare = (platform, title) => {
  event({
    action: 'share',
    category: 'engagement',
    label: `${platform}: ${title}`,
  });
};

export const trackNewsletterSignup = (location) => {
  event({
    action: 'newsletter_signup',
    category: 'conversion',
    label: location,
  });
};

export const trackAudioStart = (title) => {
  event({
    action: 'audio_start',
    category: 'engagement',
    label: title,
  });
};

export const trackArticleScroll = (title, percent) => {
  event({
    action: 'article_scroll',
    category: 'engagement',
    label: `${title} - ${percent}%`,
  });
};
