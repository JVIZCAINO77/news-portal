'use client';
// components/ViewCounter.jsx — Registra visita al artículo sin bloquear el render
import { useEffect } from 'react';

export default function ViewCounter({ slug }) {
  useEffect(() => {
    if (!slug) return;

    // Evitar conteo duplicado en la misma sesión usando sessionStorage
    const key = `viewed_${slug}`;
    if (sessionStorage.getItem(key)) return;

    // Fire & forget — no bloqueamos nada
    fetch('/api/articles/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug }),
    }).catch(() => {}); // Silencioso

    sessionStorage.setItem(key, '1');
  }, [slug]);

  return null; // Invisible — solo lógica
}
