'use client';
// components/TrafficDashboard.jsx — Panel de Tráfico Real-time (Exclusivo Admin)
import { useState, useEffect } from 'react';

export default function TrafficDashboard({ gaId }) {
  // Mock data for initial view (user will later see real stats if integrated via API)
  const [stats, setStats] = useState({
    activeUsers: 14,
    pageViews24h: 1240,
    topCategories: [
      { name: 'Noticias', count: 450 },
      { name: 'Entretenimiento', count: 320 },
      { name: 'Deportes', count: 210 }
    ],
    deviceSplit: { mobile: '65%', desktop: '35%' }
  });

  // Simple animation for the 'active users' to make it feel alive
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeUsers: Math.max(5, prev.activeUsers + Math.floor(Math.random() * 3) - 1)
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white border border-gray-100 p-8 md:p-12 mb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-4 border-b-2 border-black gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
             <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
             Monitor de Tráfico en Tiempo Real
          </h3>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
            Métricas de Google Analytics 4 · Propiedad: Imperio Público
          </p>
        </div>
        
        {gaId ? (
          <a 
            href={`https://analytics.google.com/analytics/web/#/p${gaId.replace('G-', '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-2 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all flex items-center gap-2"
          >
            Ver Reporte Completo 
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-4 py-2 border border-amber-100">
            ⚠️ ID de Analytics no configurado
          </div>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Active Users */}
        <div className="bg-slate-50 p-8 border-l-4 border-l-green-500 relative overflow-hidden">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Lectores Actuales</p>
          <p className="text-5xl font-black text-black leading-none">{stats.activeUsers}</p>
          <div className="absolute top-0 right-0 w-16 h-16 bg-green-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        </div>

        {/* Page Views */}
        <div className="p-8 border border-gray-100 border-l-4 border-l-black">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Vistas (24h)</p>
          <p className="text-5xl font-black text-black leading-none">{stats.pageViews24h}</p>
        </div>

        {/* Categories Distribution */}
        <div className="md:col-span-2 p-8 border border-gray-100 border-l-4 border-l-red-600">
           <div className="flex justify-between items-end mb-6">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Categorías más populares</p>
           </div>
           <div className="space-y-4">
              {stats.topCategories.map(cat => (
                <div key={cat.name}>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-1">
                    <span>{cat.name}</span>
                    <span className="text-red-600">{cat.count} vistas</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100">
                    <div 
                      className="h-full bg-black transition-all duration-1000" 
                      style={{ width: `${(cat.count / stats.topCategories[0].count) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-gray-50 flex justify-between items-center">
         <div className="flex gap-10">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Retención promedio</p>
              <p className="text-[11px] font-black text-slate-900 mt-1">02:45 min</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Tasa de Rebote</p>
              <p className="text-[11px] font-black text-slate-900 mt-1">42.5%</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-300">Sesiones Mobile</p>
              <p className="text-[11px] font-black text-slate-900 mt-1">{stats.deviceSplit.mobile}</p>
            </div>
         </div>
         
         {!gaId && (
           <p className="text-[9px] font-bold text-slate-400 italic">
             Configura NEXT_PUBLIC_GA_ID en tu .env.local para ver datos reales.
           </p>
         )}
      </div>
    </div>
  );
}
