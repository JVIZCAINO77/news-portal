'use client';
/**
 * components/PushSubscribeButton.jsx
 * Botón de suscripción a notificaciones push — retiene lectores y genera tráfico recurrente.
 * Funciona con el Web Push API nativo del navegador (sin librerías externas).
 * El usuario recibe alertas cuando se publica una nueva noticia.
 */
import { useState, useEffect } from 'react';

export default function PushSubscribeButton() {
  const [state, setState] = useState('idle'); // idle | subscribed | denied | loading | unsupported
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Solo mostrar si el browser lo soporta
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState('unsupported');
      return;
    }

    const perm = Notification.permission;
    if (perm === 'granted') {
      setState('subscribed');
    } else if (perm === 'denied') {
      setState('denied');
    } else {
      // Mostrar banner después de 15s (usuario ya vio el contenido)
      const timer = setTimeout(() => setShowBanner(true), 15000);
      return () => clearTimeout(timer);
    }
  }, []);

  const subscribe = async () => {
    setState('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Registrar el service worker
        const reg = await navigator.serviceWorker.ready;
        // Si tienes VAPID key configurada, suscribir al servidor
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        }
        setState('subscribed');
        setShowBanner(false);
        // Mostrar notificación de bienvenida inmediata
        new Notification('¡Bienvenido a Imperio Público! 🏆', {
          body: 'Te avisaremos cuando publiquemos las últimas noticias.',
          icon: '/icon.png',
          badge: '/icon.png',
        });
      } else {
        setState('denied');
        setShowBanner(false);
      }
    } catch (e) {
      console.error('[Push] Error al suscribirse:', e);
      setState('idle');
    }
  };

  // No renderizar si no soportado o ya denegado
  if (state === 'unsupported' || state === 'denied') return null;

  // Banner flotante de solicitud (aparece tras 15s)
  if (showBanner && state === 'idle') {
    return (
      <div
        id="push-banner"
        className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[200] animate-in fade-in slide-in-from-bottom-4 duration-500"
        role="dialog"
        aria-label="Activar notificaciones"
      >
        <div className="bg-black text-white rounded-2xl p-5 shadow-2xl border border-white/10">
          <div className="flex items-start gap-4">
            {/* Icono */}
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-black text-sm uppercase tracking-tight mb-1">¡No te pierdas nada!</p>
              <p className="text-white/60 text-xs leading-relaxed">
                Activa las alertas y te avisamos al instante cuando publiquemos una noticia importante.
              </p>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-white/30 hover:text-white transition-colors flex-shrink-0 ml-1"
              aria-label="Cerrar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={subscribe}
              disabled={state === 'loading'}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {state === 'loading' ? 'Activando...' : '🔔 Activar alertas'}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white/60 text-xs font-bold uppercase tracking-widest py-2.5 rounded-xl transition-all"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si ya está suscrito, botón pequeño en header (opcional)
  if (state === 'subscribed') return null;

  return null;
}

/** Convierte una VAPID key de base64url a Uint8Array */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
