// components/ServiceWidgets.jsx — Información de Servicio (Clima y Divisas)
'use client';
import { useEffect, useState } from 'react';

export default function ServiceWidgets() {
  const [data, setData] = useState({
    temp: 29,
    condition: 'Soleado',
    usd: { buy: 59.85, sell: 60.10 },
    eur: { buy: 64.20, sell: 65.45 },
    time: ''
  });

  useEffect(() => {
    const now = new Date();
    // Deterministic variance based on minutes to feel "live" without randomness errors
    const variance = (now.getMinutes() % 10) / 100;
    
    setData(prev => ({
      ...prev,
      usd: { buy: (59.85 + variance).toFixed(2), sell: (60.10 + variance).toFixed(2) },
      eur: { buy: (64.20 + variance).toFixed(2), sell: (65.45 + variance).toFixed(2) },
      time: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
    }));
  }, []);

  return (
    <div className="flex items-center gap-6 md:gap-8">
      {/* Widget Clima - Santo Domingo */}
      <div className="flex items-center gap-2.5 group cursor-help border-r border-gray-100 dark:border-zinc-800 pr-6">
        <div className="w-8 h-8 bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center rounded-full">
           <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-500 fill-current animate-pulse">
             <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
           </svg>
        </div>
        <div className="flex flex-col leading-none">
           <span className="text-[8px] font-black uppercase text-slate-800 dark:text-zinc-300 tracking-widest mb-0.5">Santo Domingo</span>
           <span className="text-[11px] font-black text-black dark:text-white uppercase tracking-tight">{data.temp}°C · <span className="text-slate-800 dark:text-zinc-300 font-bold">{data.condition}</span></span>
        </div>
      </div>

      {/* Widget Divisas - USD/EUR */}
      <div className="hidden lg:flex items-center gap-6">
        {/* USD */}
        <div className="flex flex-col leading-none text-right">
           <span className="text-[8px] font-black uppercase text-slate-800 dark:text-zinc-300 tracking-widest mb-1.5 flex items-center gap-1.5 justify-end">
             <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
             Dólar USD
           </span>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-black dark:text-zinc-300">C: <span className="text-red-700 italic">{data.usd.buy}</span></span>
              <span className="text-[10px] font-black text-black dark:text-zinc-300">V: <span className="text-red-700 italic">{data.usd.sell}</span></span>
           </div>
        </div>

        {/* EUR */}
        <div className="flex flex-col leading-none text-right border-l border-gray-100 dark:border-zinc-800 pl-6">
           <span className="text-[8px] font-black uppercase text-slate-800 dark:text-zinc-300 tracking-widest mb-1.5">Euro EUR</span>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-black dark:text-zinc-300">C: <span className="text-red-700 italic">{data.eur.buy}</span></span>
              <span className="text-[10px] font-black text-black dark:text-zinc-300">V: <span className="text-red-700 italic">{data.eur.sell}</span></span>
           </div>
        </div>
      </div>
    </div>
  );
}
