'use client';
import { useState } from 'react';

export default function ImageRepairButton({ cronSecret }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | repairing | done | error
  const [stats, setStats] = useState(null);
  const [progress, setProgress] = useState({ repaired: 0, ai: 0, failed: 0, batches: 0 });

  const scan = async () => {
    setStatus('scanning');
    setStats(null);
    try {
      const res = await fetch(`/api/admin/repair-images?secret=${cronSecret}`);
      const data = await res.json();
      setStats(data.summary);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  const repair = async () => {
    setStatus('repairing');
    setProgress({ repaired: 0, ai: 0, failed: 0, batches: 0 });
    let remaining = 9999;
    let batches = 0;
    let totalRepaired = 0;
    let totalAi = 0;
    let totalFailed = 0;

    try {
      while (remaining > 0 && batches < 30) {
        const res = await fetch(`/api/admin/repair-images?secret=${cronSecret}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ limit: 10 }),
        });
        const data = await res.json();
        batches++;
        totalRepaired += data.results?.repaired || 0;
        totalAi += data.results?.ai_generated || 0;
        totalFailed += data.results?.failed || 0;
        remaining = data.remaining || 0;
        setProgress({ repaired: totalRepaired, ai: totalAi, failed: totalFailed, batches });
        if (remaining > 0) await new Promise(r => setTimeout(r, 1500));
      }
      // Re-scan final
      const finalRes = await fetch(`/api/admin/repair-images?secret=${cronSecret}`);
      const finalData = await finalRes.json();
      setStats(finalData.summary);
      setStatus('done');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="bg-white border border-gray-100 p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Reparación de Imágenes</h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Re-internaliza imágenes externas rotas a Cloudinary
          </p>
        </div>
        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 ${
          status === 'done' ? 'bg-green-100 text-green-700' :
          status === 'repairing' || status === 'scanning' ? 'bg-yellow-100 text-yellow-700' :
          status === 'error' ? 'bg-red-100 text-red-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {status === 'idle' ? 'En Espera' :
           status === 'scanning' ? '⏳ Analizando...' :
           status === 'repairing' ? `⚙️ Lote ${progress.batches}` :
           status === 'done' ? '✅ Completado' : '❌ Error'}
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-slate-50 border border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-black text-black">{stats.total}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-green-600">{stats.cloudinary}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">En Cloudinary</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-black ${stats.broken > 0 ? 'text-red-600' : 'text-green-600'}`}>{stats.broken}</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Rotas</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-black ${stats.percentageSafe >= 95 ? 'text-green-600' : 'text-yellow-600'}`}>{stats.percentageSafe}%</p>
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Seguras</p>
          </div>
        </div>
      )}

      {/* Progress durante reparación */}
      {status === 'repairing' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-100">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-700">Reparando...</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-black text-green-600">{progress.repaired}</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400">A Cloudinary</p>
            </div>
            <div>
              <p className="text-xl font-black text-blue-600">{progress.ai}</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400">Imagen IA</p>
            </div>
            <div>
              <p className="text-xl font-black text-red-500">{progress.failed}</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400">Fallidos</p>
            </div>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-700">
            ✅ {progress.repaired} imágenes a Cloudinary · {progress.ai} generadas por IA · {progress.failed} fallidas
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600">
            Error en la conexión. Verifica que el servidor esté activo.
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4">
        <button
          onClick={scan}
          disabled={status === 'scanning' || status === 'repairing'}
          className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-slate-100 hover:bg-slate-900 hover:text-white transition-all disabled:opacity-40"
        >
          Diagnosticar
        </button>
        <button
          onClick={repair}
          disabled={status === 'repairing' || status === 'scanning' || (stats?.broken === 0)}
          className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest bg-black text-white hover:bg-red-600 transition-all disabled:opacity-40"
        >
          {status === 'repairing' ? `Reparando lote ${progress.batches}...` : 'Reparar Todo'}
        </button>
      </div>
      {stats?.broken === 0 && status !== 'scanning' && (
        <p className="text-center text-[9px] font-black uppercase tracking-widest text-green-600 mt-3">
          ✅ Todas las imágenes están en Cloudinary
        </p>
      )}
    </div>
  );
}
