'use client';
// components/AutomationToggle.jsx — Control de Automatización (Imperio Público 2.0)
import { useState } from 'react';
import { toggleAutomation } from '@/app/admin/actions';

export default function AutomationToggle({ initialValue, isAdmin }) {
  const [enabled, setEnabled] = useState(initialValue === true);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const nextValue = !enabled;
      await toggleAutomation(nextValue);
      setEnabled(nextValue);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-8 border border-gray-100 border-l-4 transition-all ${
      enabled ? 'bg-red-50 border-l-red-600' : 'bg-slate-50 border-l-slate-400'
    }`}>
      <div className="flex justify-between items-center">
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Bot de Automatización</p>
            <h4 className="text-xl font-black uppercase tracking-tighter">
              {enabled ? 'ACTIVO (Publicando)' : 'PAUSADO (Manual)'}
            </h4>
         </div>
         <button 
           onClick={handleToggle}
           disabled={loading || !isAdmin}
           className={`px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${
             enabled 
               ? 'bg-black text-white hover:bg-slate-800' 
               : 'bg-red-600 text-white hover:bg-black'
           } disabled:opacity-50`}
         >
           {loading ? 'Procesando...' : enabled ? 'Detener Bot' : 'Activar Bot'}
         </button>
      </div>
      {!isAdmin && (
        <p className="text-[8px] font-bold text-slate-300 uppercase mt-4 tracking-widest">
          ⚠️ Solo administradores pueden cambiar este ajuste
        </p>
      )}
    </div>
  );
}
