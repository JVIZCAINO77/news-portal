'use client';
// components/TrafficDashboard.jsx — Panel de Tráfico Real (Exclusivo Admin)

export default function TrafficDashboard({ gaId, siteUrl, realStats }) {
  const totalViews    = realStats?.totalViews  || 0;
  const topCategories = realStats?.topCategories?.length > 0 ? realStats.topCategories : null;

  return (
    <div className="bg-white border border-gray-100 p-8 md:p-12 mb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-4 border-b-2 border-black gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
             <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
             Monitor de Tráfico
          </h3>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
            Datos reales del portal · Google Analytics 4 para métricas avanzadas
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {gaId ? (
            <a 
              href={`https://analytics.google.com/analytics/web/#/p${gaId.replace('G-', '')}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-2 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-red-600 transition-all flex items-center gap-2"
            >
              Google Analytics
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ) : (
            <div className="text-[9px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-4 py-2 border border-amber-100">
              ⚠️ Analytics no configurado
            </div>
          )}

          <a 
            href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(siteUrl || 'https://imperiopublico.com/')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-6 py-2 border-2 border-black text-black text-[9px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all flex items-center gap-2"
          >
            Search Console
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Views de la DB */}
        <div className="bg-slate-50 p-8 border-l-4 border-l-black">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Vistas Totales (DB)</p>
          <p className="text-5xl font-black text-black leading-none">{totalViews.toLocaleString('es-DO')}</p>
          <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-2 font-bold">Acumulado histórico</p>
        </div>

        {/* Top Categorías */}
        <div className="md:col-span-2 p-8 border border-gray-100 border-l-4 border-l-red-600">
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-6">Categorías · Vistas reales</p>
           {topCategories ? (
             <div className="space-y-4">
               {topCategories.map(cat => (
                 <div key={cat.name}>
                   <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-1">
                     <span>{cat.name}</span>
                     <span className="text-red-600">{(cat.count || 0).toLocaleString('es-DO')} vistas</span>
                   </div>
                   <div className="h-1 w-full bg-slate-100">
                     <div 
                       className="h-full bg-black transition-all duration-1000" 
                       style={{ width: `${(cat.count / (topCategories[0]?.count || 1)) * 100}%` }}
                     ></div>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="flex items-center justify-center h-24">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                 Aún no hay datos de vistas disponibles.
               </p>
             </div>
           )}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-50">
        {!gaId && (
          <p className="text-[9px] font-bold text-slate-400 italic">
            Configura <code className="text-red-600">NEXT_PUBLIC_GA_ID</code> en Vercel para ver métricas avanzadas en tiempo real.
          </p>
        )}
      </div>
    </div>
  );
}
