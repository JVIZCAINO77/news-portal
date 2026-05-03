// components/ServiceWidgets.jsx — Información de Servicio (Clima y Divisas)
'use client';
import { useEffect, useState } from 'react';

// Tasas de referencia del BCRD (actualizadas manualmente, fuente: bcrd.gov.do)
// Se muestran como referencia informativa
const REFERENCE_RATES = {
  usd: { buy: 59.85, sell: 61.20 },
  eur: { buy: 64.10, sell: 65.80 },
};

export default function ServiceWidgets() {
  const [time, setTime] = useState('');
  const [rates, setRates] = useState(REFERENCE_RATES);

  useEffect(() => {
    // Actualizar la hora en tiempo real
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000); // actualizar cada 30s

    // Intentar obtener tasas reales de cambio (API pública gratuita)
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=DOP,EUR', {
          next: { revalidate: 3600 } // Cachear 1 hora
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.rates?.DOP) {
          const dopPerUsd = data.rates.DOP;
          const dopPerEur = data.rates.DOP / (data.rates.EUR || 1.08); // EUR/DOP aproximado
          setRates({
            usd: {
              buy: (dopPerUsd * 0.988).toFixed(2),  // ~1.2% spread compra
              sell: (dopPerUsd * 1.002).toFixed(2), // ~0.2% spread venta
            },
            eur: {
              buy: (dopPerEur * 0.986).toFixed(2),
              sell: (dopPerEur * 1.004).toFixed(2),
            },
          });
        }
      } catch {
        // Silently fall back to reference rates
      }
    };
    fetchRates();

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-6 md:gap-8">
      {/* Widget Hora - Santo Domingo */}
      <div className="flex items-center gap-2 border-r border-gray-100 pr-6">
        <div className="flex flex-col leading-none">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-0.5">
            Santo Domingo
          </span>
          <span className="text-[11px] font-black text-black uppercase tracking-tight">
            {time || '--:--'}{' '}
            <span className="text-slate-500 font-bold text-[9px]">AST</span>
          </span>
        </div>
      </div>

      {/* Widget Divisas - USD/EUR */}
      <div className="hidden lg:flex items-center gap-6">
        {/* USD */}
        <div className="flex flex-col leading-none text-right">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1.5 flex items-center gap-1.5 justify-end">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Dólar USD
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-black">
              C: <span className="text-red-700 italic">{rates.usd.buy}</span>
            </span>
            <span className="text-[10px] font-black text-black">
              V: <span className="text-red-700 italic">{rates.usd.sell}</span>
            </span>
          </div>
        </div>

        {/* EUR */}
        <div className="flex flex-col leading-none text-right border-l border-gray-100 pl-6">
          <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest mb-1.5">
            Euro EUR
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-black">
              C: <span className="text-red-700 italic">{rates.eur.buy}</span>
            </span>
            <span className="text-[10px] font-black text-black">
              V: <span className="text-red-700 italic">{rates.eur.sell}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
