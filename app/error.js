'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Aquí puedes registrar el error en un sistema externo si lo tienes (ej. Sentry, LogRocket)
    console.error('Aplicación interceptó un error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white border border-gray-200 p-8 shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-black mb-2 uppercase tracking-tight">Ocurrió un Problema</h2>
        <p className="text-sm text-gray-600 mb-8 italic">
          Nuestros sistemas detectaron un error inesperado al cargar esta información.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full bg-red-600 text-white font-bold py-3 uppercase tracking-widest text-[10px] hover:bg-black transition-colors"
          >
            Intentar de Nuevo
          </button>
          <Link
            href="/"
            className="w-full bg-slate-100 text-black font-bold py-3 uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors inline-block"
          >
            Volver a Portada
          </Link>
        </div>
      </div>
    </div>
  );
}
