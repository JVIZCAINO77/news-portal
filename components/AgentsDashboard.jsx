'use client';
// components/AgentsDashboard.jsx — Panel de Control de Agentes IA (Imperio Público 2.0)
import { useState } from 'react';

// ── 33 categorías en el mismo orden de rotación del bot ──────────────────────
const AGENTS = [
  // TIER 1 — Alto tráfico
  { category: 'politica',        label: 'Política',        author: 'Mesa Política',           icon: '🏛️', color: 'border-l-slate-700',   bg: 'bg-slate-50'   },
  { category: 'policia',         label: 'Policía',         author: 'Sección Policial',        icon: '👮', color: 'border-l-zinc-700',    bg: 'bg-zinc-50'    },
  { category: 'deportes',        label: 'Deportes',        author: 'Mesa Deportiva',          icon: '⚾', color: 'border-l-blue-600',    bg: 'bg-blue-50'    },
  { category: 'tecnologia',      label: 'Tecnología',      author: 'Redacción Tecnológica',   icon: '💻', color: 'border-l-cyan-600',    bg: 'bg-cyan-50'    },
  { category: 'sucesos',         label: 'Sucesos',         author: 'Redacción de Sucesos',    icon: '🚨', color: 'border-l-orange-600',  bg: 'bg-orange-50'  },
  { category: 'entretenimiento', label: 'Entretenimiento', author: 'Sección Espectáculos',    icon: '🎬', color: 'border-l-violet-600',  bg: 'bg-violet-50'  },
  { category: 'economia',        label: 'Economía',        author: 'Redacción Económica',     icon: '📈', color: 'border-l-emerald-600', bg: 'bg-emerald-50' },
  { category: 'internacional',   label: 'Internacional',   author: 'Redacción Internacional', icon: '🌍', color: 'border-l-indigo-600',  bg: 'bg-indigo-50'  },
  { category: 'salud',           label: 'Salud',           author: 'Sección de Salud',        icon: '🏥', color: 'border-l-green-600',   bg: 'bg-green-50'   },
  { category: 'cultura',         label: 'Cultura',         author: 'Sección Cultural',        icon: '🎨', color: 'border-l-pink-600',    bg: 'bg-pink-50'    },
  // TIER 2 — Nacionales
  { category: 'nacional',        label: 'Nacional',        author: 'Redacción Nacional',      icon: '📰', color: 'border-l-gray-700',    bg: 'bg-gray-50'    },
  { category: 'gobierno',        label: 'Gobierno',        author: 'Redacción Gubernamental', icon: '🏛', color: 'border-l-gray-600',    bg: 'bg-gray-50'    },
  { category: 'justicia',        label: 'Justicia',        author: 'Sección Judicial',        icon: '⚖️', color: 'border-l-stone-600',   bg: 'bg-stone-50'   },
  { category: 'congreso',        label: 'Congreso',        author: 'Redacción Legislativa',   icon: '🏢', color: 'border-l-neutral-600', bg: 'bg-neutral-50' },
  { category: 'educacion',       label: 'Educación',       author: 'Sección Educación',       icon: '📚', color: 'border-l-yellow-600',  bg: 'bg-yellow-50'  },
  // TIER 3 — Lifestyle & Tendencias
  { category: 'tendencias',      label: 'Tendencias',      author: 'Mesa de Tendencias',      icon: '🔥', color: 'border-l-rose-600',    bg: 'bg-rose-50'    },
  { category: 'farandula',       label: 'Farándula',       author: 'Sección Farándula',       icon: '🌟', color: 'border-l-fuchsia-600', bg: 'bg-fuchsia-50' },
  { category: 'musica',          label: 'Música',          author: 'Mesa Musical',            icon: '🎵', color: 'border-l-purple-600',  bg: 'bg-purple-50'  },
  { category: 'cine',            label: 'Cine',            author: 'Sección Cine',            icon: '🎥', color: 'border-l-amber-600',   bg: 'bg-amber-50'   },
  { category: 'virales',         label: 'Virales',         author: 'Mesa de Virales',         icon: '📱', color: 'border-l-teal-600',    bg: 'bg-teal-50'    },
  { category: 'moda',            label: 'Moda',            author: 'Sección Moda',            icon: '👗', color: 'border-l-lime-600',    bg: 'bg-lime-50'    },
  { category: 'gastronomia',     label: 'Gastronomía',     author: 'Sección Gastronomía',     icon: '🍽️', color: 'border-l-orange-500',  bg: 'bg-orange-50'  },
  { category: 'turismo',         label: 'Turismo',         author: 'Sección Turismo',         icon: '✈️', color: 'border-l-sky-600',     bg: 'bg-sky-50'     },
  // TIER 4 — Especializadas & Territoriales
  { category: 'finanzas',        label: 'Finanzas',        author: 'Redacción Financiera',    icon: '💰', color: 'border-l-green-700',   bg: 'bg-green-50'   },
  { category: 'emprendimiento',  label: 'Emprendimiento',  author: 'Sección Emprendimiento',  icon: '🚀', color: 'border-l-blue-700',    bg: 'bg-blue-50'    },
  { category: 'medio-ambiente',  label: 'Medio Ambiente',  author: 'Sección Medio Ambiente',  icon: '🌿', color: 'border-l-emerald-700', bg: 'bg-emerald-50' },
  { category: 'provincias',      label: 'Provincias',      author: 'Corresponsalía Nacional', icon: '🗺️', color: 'border-l-stone-500',   bg: 'bg-stone-50'   },
  { category: 'eeuu',            label: 'EE.UU.',          author: 'Corresponsal EE.UU.',     icon: '🇺🇸', color: 'border-l-blue-800',    bg: 'bg-blue-50'    },
  { category: 'haiti',           label: 'Haití',           author: 'Redacción Fronteriza',    icon: '🇭🇹', color: 'border-l-red-800',     bg: 'bg-red-50'     },
  { category: 'espana',          label: 'España',          author: 'Corresponsal España',     icon: '🇪🇸', color: 'border-l-yellow-700',  bg: 'bg-yellow-50'  },
  { category: 'europa',          label: 'Europa',          author: 'Redacción Europa',        icon: '🇪🇺', color: 'border-l-indigo-700',  bg: 'bg-indigo-50'  },
  { category: 'opinion',         label: 'Opinión',         author: 'Mesa Editorial',          icon: '✍️', color: 'border-l-slate-500',   bg: 'bg-slate-50'   },
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

      // Protección: si la respuesta no es JSON válido (ej: error 500 de Vercel)
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch {
        setResults(prev => ({ ...prev, [category]: { ok: false, msg: 'Error del servidor. Revisa los logs de Vercel.' } }));
        return;
      }

      if (res.ok && data.result?.success) {
        setResults(prev => ({
          ...prev,
          [category]: { ok: true, title: data.result.article?.title || '¡Publicado!' },
        }));
      } else {
        const rawMsg = data.result?.message || data.result?.error || data.error || 'Error desconocido';
        let cleanMsg = String(rawMsg);

        if (cleanMsg.startsWith('{')) {
          try { cleanMsg = JSON.parse(cleanMsg).error?.message || cleanMsg; } catch {}
        }
        if (cleanMsg.includes('Quota exceeded') || cleanMsg.includes('429')) {
          cleanMsg = 'Cuota de IA agotada. Intenta más tarde.';
        }
        if (cleanMsg.includes('No se pudo generar')) {
          cleanMsg = 'Sin noticias válidas para esta categoría ahora. Intenta en unos minutos.';
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
            {AGENTS.length} agentes configurados · Rotación automática diaria · Hora República Dominicana (UTC-4)
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
            ⚠️ El bot está pausado. Actívalo arriba para publicación automática.
            Puedes disparar manualmente de todas formas.
          </p>
        </div>
      )}

      {/* Info: horario del bot */}
      <div className="mb-8 p-4 bg-slate-50 border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
        📅 Crons activos: 7:00 AM · 9:30 AM · 12:00 PM · 2:30 PM · 5:00 PM · 7:30 PM RD — El bot rota entre las 33 categorías automáticamente (6 artículos/día)
      </div>

      {/* Grid de Agentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

              {/* Category badge */}
              <div className={`${agent.bg} px-3 py-2`}>
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Categoría</p>
                <p className="text-[10px] font-black text-black mt-0.5 font-mono">{agent.category}</p>
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
