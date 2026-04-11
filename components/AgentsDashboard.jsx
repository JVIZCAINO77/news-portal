'use client';
// components/AgentsDashboard.jsx — Panel de Control de Agentes IA (PulsoNoticias 2.0)
import { useState } from 'react';

const AGENTS = [
  {
    category: 'noticias',
    label: 'Noticias Generales',
    author: 'Carlos Mendoza',
    scheduleUTC: '11:00 UTC',
    scheduleRD: '7:00 AM RD',
    icon: '📰',
    color: 'border-l-red-600',
    bg: 'bg-red-50',
  },
  {
    category: 'economia',
    label: 'Economía',
    author: 'Roberto Silva',
    scheduleUTC: '13:00 UTC',
    scheduleRD: '9:00 AM RD',
    icon: '📈',
    color: 'border-l-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    category: 'deportes',
    label: 'Deportes',
    author: 'Marcos Alarcón',
    scheduleUTC: '15:00 UTC',
    scheduleRD: '11:00 AM RD',
    icon: '⚾',
    color: 'border-l-blue-600',
    bg: 'bg-blue-50',
  },
  {
    category: 'entretenimiento',
    label: 'Entretenimiento',
    author: 'Valeria Reyes',
    scheduleUTC: '19:00 UTC',
    scheduleRD: '3:00 PM RD',
    icon: '🎬',
    color: 'border-l-violet-600',
    bg: 'bg-violet-50',
  },
  {
    category: 'tecnologia',
    label: 'Tecnología',
    author: 'Elena Torres',
    scheduleUTC: '22:00 UTC',
    scheduleRD: '6:00 PM RD',
    icon: '💻',
    color: 'border-l-cyan-600',
    bg: 'bg-cyan-50',
  },
];

export default function AgentsDashboard({ botEnabled }) {
  const [loadingAgent, setLoadingAgent] = useState(null);
  const [results, setResults] = useState({});

  const triggerAgent = async (category) => {
    setLoadingAgent(category);
    setResults(prev => ({ ...prev, [category]: null }));

    try {
      const res = await fetch('/api/cron/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      const data = await res.json();

      if (res.ok && data.result?.success) {
        setResults(prev => ({
          ...prev,
          [category]: { ok: true, title: data.result.article?.title || '¡Publicado!' },
        }));
      } else {
        const rawMsg = data.result?.message || data.result?.error || data.error || 'Error desconocido';
        let cleanMsg = rawMsg;
        
        // Limpiar JSON si viene como string
        if (typeof rawMsg === 'string' && rawMsg.startsWith('{')) {
          try {
            const parsed = JSON.parse(rawMsg);
            cleanMsg = parsed.error?.message || parsed.message || rawMsg;
          } catch (e) { /* ignore */ }
        }

        // Más limpieza para errores de cuota de Gemini
        if (cleanMsg.includes('Quota exceeded') || cleanMsg.includes('429')) {
          cleanMsg = 'Límite de cuota de IA alcanzado. Intenta de nuevo en un momento.';
        }

        setResults(prev => ({ ...prev, [category]: { ok: false, msg: cleanMsg } }));
      }
    } catch (err) {
      setResults(prev => ({ ...prev, [category]: { ok: false, msg: 'Error de conexión.' } }));
    } finally {
      setLoadingAgent(null);
    }
  };

  return (
    <div className="bg-white border border-gray-100 p-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-4 border-b-2 border-black gap-4">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter">Agentes de Publicación</h3>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
            5 bots activos · Publicación automática diaria · Hora República Dominicana (UTC-4)
          </p>
        </div>
        <div className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border ${
          botEnabled 
            ? 'text-red-600 bg-red-50 border-red-200' 
            : 'text-slate-400 bg-slate-50 border-slate-200'
        }`}>
          {botEnabled ? '● Sistema Activo' : '○ Sistema Pausado'}
        </div>
      </div>

      {/* Warning si el bot está pausado */}
      {!botEnabled && (
        <div className="mb-8 p-6 bg-amber-50 border border-amber-200 border-l-4 border-l-amber-500">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">
            ⚠️ El bot está pausado. Actívalo arriba para que los agentes publiquen automáticamente.
            Puedes disparar manualmente de todas formas para probar.
          </p>
        </div>
      )}

      {/* Grid de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {AGENTS.map((agent) => {
          const isLoading = loadingAgent === agent.category;
          const result = results[agent.category];

          return (
            <div
              key={agent.category}
              className={`border border-gray-100 border-l-4 ${agent.color} p-6 flex flex-col gap-4 transition-all`}
            >
              {/* Icon & Name */}
              <div>
                <span className="text-2xl">{agent.icon}</span>
                <h4 className="text-sm font-black uppercase tracking-tight mt-2 leading-tight">{agent.label}</h4>
                <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-1">{agent.author}</p>
              </div>

              {/* Schedule */}
              <div className={`${agent.bg} px-3 py-2 rounded-none`}>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Próxima Publicación</p>
                <p className="text-[10px] font-black text-black mt-0.5">{agent.scheduleRD}</p>
                <p className="text-[8px] text-slate-400 font-bold">{agent.scheduleUTC}</p>
              </div>

              {/* Result feedback */}
              {result && (
                <div className={`p-3 border ${result.ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  {result.ok ? (
                    <p className="text-[8px] font-black uppercase tracking-wide text-green-700 leading-relaxed">
                      ✓ {result.title}
                    </p>
                  ) : (
                    <p className="text-[8px] font-black uppercase tracking-wide text-red-700 leading-relaxed">
                      ✗ {result.msg}
                    </p>
                  )}
                </div>
              )}

              {/* Trigger Button */}
              <button
                onClick={() => triggerAgent(agent.category)}
                disabled={isLoading}
                className={`mt-auto w-full py-3 text-[8px] font-black uppercase tracking-widest transition-all ${
                  isLoading
                    ? 'bg-slate-100 text-slate-400 cursor-wait'
                    : 'bg-black text-white hover:bg-red-600'
                }`}
              >
                {isLoading ? '◌ Publicando...' : '▶ Disparar Ahora'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-[8px] font-bold uppercase tracking-widest text-slate-300 text-center">
        Los agentes se ejecutan automáticamente en los horarios indicados si el sistema está activo.
        &quot;Disparar Ahora&quot; publica de inmediato para pruebas.
      </p>
    </div>
  );
}
