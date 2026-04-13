// components/ServiceWidgets.jsx — Información de Servicio (Clima y Divisas)
'use client';
import { useEffect, useState } from 'react';

export default function ServiceWidgets() {
  const [data, setData] = useState({
    temp: 29,
    condition: 'Soleado',
    usd: { buy: 59.85, sell: 61.20 },
    time: ''
  });

  useEffect(() => {
    // Simulamos la actualización de datos para que el portal se sienta 'en vivo'
    const now = new Date();
    setData(prev => ({
      ...prev,
      time: now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
    }));

    // NOTA PARA DESARROLLO: Aquí se puede conectar con API de OpenWeatherMap 
    // y algún servicio de divisas en el futuro.
  }, []);

  return (
    <div className="flex items-center gap-6 md:gap-10">
      {/* Widget Clima */}
      <div className="flex items-center gap-2 group cursor-help">
        <div className="relative">
           <svg viewBox="0 0 24 24" className="w-5 h-5 text-yellow-500 fill-current animate-pulse">
             <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 00-1.41 0 .996.996 0 000 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 000-1.41.996.996 0 00-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z" />
           </svg>
        </div>
        <div className="flex flex-col leading-none">
           <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest mb-0.5">Santo Domingo</span>
           <span className="text-[11px] font-black text-black uppercase tracking-tight">{data.temp}°C · <span className="text-slate-400 font-bold">{data.condition}</span></span>
        </div>
      </div>

      {/* Widget Divisa */}
      <div className="hidden lg:flex items-center gap-3 border-l border-gray-100 pl-6 group">
        <div className="flex flex-col leading-none text-right">
           <span className="text-[8px] font-black uppercase text-slate-300 tracking-widest mb-0.5">Dólar USD</span>
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-black">C: <span className="text-red-600 italic">{data.usd.buy}</span></span>
              <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
              <span className="text-[10px] font-black text-black">V: <span className="text-red-600 italic">{data.usd.sell}</span></span>
           </div>
        </div>
        <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-sm group-hover:bg-yellow-400 transition-colors">
           <span className="text-lg font-black text-black select-none">$</span>
        </div>
      </div>
    </div>
  );
}
