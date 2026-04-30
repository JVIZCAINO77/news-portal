'use client';
// app/admin/error.js — Error boundary específico del panel admin
import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({ error, reset }) {
  useEffect(() => {
    console.error('[Admin] Error capturado:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white border-2 border-red-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-black uppercase tracking-tight">Error en el Panel Admin</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">/admin — error.js</p>
          </div>
        </div>

        {/* Mensaje de error real para depuración */}
        <div className="bg-slate-900 text-red-400 p-4 rounded font-mono text-xs mb-6 overflow-auto max-h-48">
          <p className="text-slate-400 mb-1">Error:</p>
          <p className="text-red-300">{error?.message || 'Error desconocido'}</p>
          {error?.digest && (
            <p className="text-slate-500 mt-2">Digest: {error.digest}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-red-600 text-white font-bold py-3 uppercase tracking-widest text-[10px] hover:bg-black transition-colors"
          >
            Intentar de Nuevo
          </button>
          <Link
            href="/admin"
            className="flex-1 text-center bg-slate-100 text-black font-bold py-3 uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-colors inline-block"
          >
            Volver al Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
