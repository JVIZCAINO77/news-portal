'use client';
// components/BotControls.jsx — Botones ACTIVAR / PAUSAR del Bot en Sidebar
import { useState } from 'react';
import { toggleAutomation } from '@/app/admin/actions';

export default function BotControls({ initialEnabled }) {
  const [enabled, setEnabled] = useState(initialEnabled === true);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (activate) => {
    if (loading) return;
    setLoading(true);
    try {
      await toggleAutomation(activate);
      setEnabled(activate);
    } catch (err) {
      alert(err.message || 'Error al cambiar estado del bot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Estado actual */}
      <div className={`flex items-center gap-2 px-3 py-2 border text-[8px] font-black uppercase tracking-widest ${
        enabled
          ? 'border-red-500/30 bg-red-600/10 text-red-400'
          : 'border-white/10 bg-white/5 text-white/40'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${enabled ? 'bg-red-500 animate-pulse' : 'bg-white/30'}`} />
        {enabled ? 'Publicando noticias' : 'Bot pausado'}
      </div>

      {/* Dos botones: ACTIVAR y PAUSAR */}
      <div className="grid grid-cols-2 gap-1">
        <button
          onClick={() => handleToggle(true)}
          disabled={loading || enabled}
          className={`py-2.5 text-[8px] font-black uppercase tracking-widest transition-all ${
            enabled
              ? 'bg-green-600/20 text-green-400 cursor-default border border-green-600/30'
              : 'bg-green-600 text-white hover:bg-green-500'
          } disabled:opacity-60`}
        >
          {loading && !enabled ? '...' : 'Activar'}
        </button>
        <button
          onClick={() => handleToggle(false)}
          disabled={loading || !enabled}
          className={`py-2.5 text-[8px] font-black uppercase tracking-widest transition-all ${
            !enabled
              ? 'bg-white/5 text-white/30 cursor-default border border-white/10'
              : 'bg-red-600 text-white hover:bg-red-500'
          } disabled:opacity-60`}
        >
          {loading && enabled ? '...' : 'Pausar'}
        </button>
      </div>
    </div>
  );
}
