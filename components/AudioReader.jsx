
'use client';
// components/AudioReader.jsx — Lector de Artículos con Voz de IA (Nativo)
import { useState, useEffect, useRef } from 'react';

export default function AudioReader({ title, text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef(null);

  const cleanText = (rawText) => {
    if (!rawText) return "";
    return rawText
      .replace(/[\s\*]*etiquetas\s*(seo)?\s*:.*$/gis, '') 
      .replace(/[\s\*]*tags?\s*:.*$/gis, '')
      .replace(/[\s\*]*palabras\s*clave\s*:.*$/gis, '')
      .replace(/[\s\*]*keywords?\s*:.*$/gis, '')
      .replace(/<[^>]*>/g, '') 
      .replace(/!\[.*?\]\(.*?\)/g, '') 
      .replace(/#+/g, '') 
      .replace(/_{1,}/g, ' ') 
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/---/g, '')
      .replace(/\[|\]|\(|\)/g, '') 
      .replace(/\\+n/g, ' ') 
      .replace(/\s+/g, ' ') 
      .trim();
  };

  const startReading = () => {
    if (typeof window === 'undefined') return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    window.speechSynthesis.cancel();

    const fullText = `${cleanText(title)}. ${cleanText(text)}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onboundary = (event) => {
      const charIndex = event.charIndex;
      const totalChars = fullText.length;
      setProgress((charIndex / totalChars) * 100);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setProgress(100);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const pauseReading = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
    setIsPaused(true);
  };

  const stopReading = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-slate-200 bg-white/50 backdrop-blur-md p-5 md:p-8 mb-8 transition-all hover:shadow-xl hover:border-red-100">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-500/5 rounded-full blur-3xl group-hover:bg-red-500/10 transition-colors"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        
        {/* Play Button Section */}
        <div className="relative flex-shrink-0">
          {!isPlaying || isPaused ? (
            <button 
              onClick={startReading}
              className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-red-600 transition-all shadow-2xl hover:scale-105 active:scale-95 group/btn"
              aria-label="Escuchar artículo"
            >
              <svg className="w-10 h-10 ml-1 transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={pauseReading}
              className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-slate-900 transition-all shadow-2xl hover:scale-105 active:scale-95 group/btn"
              aria-label="Pausar lectura"
            >
              <div className="flex gap-1.5 items-center justify-center">
                 <div className="w-1.5 h-8 bg-white rounded-full animate-[bounce_1s_infinite_0s]"></div>
                 <div className="w-1.5 h-10 bg-white rounded-full animate-[bounce_1s_infinite_0.2s]"></div>
                 <div className="w-1.5 h-8 bg-white rounded-full animate-[bounce_1s_infinite_0.4s]"></div>
              </div>
            </button>
          )}

          {isPlaying && (
             <button 
              onClick={stopReading}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 shadow-sm transition-colors"
              title="Detener"
             >
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
             </button>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 w-full space-y-4">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-1">Experiencia Auditiva</h4>
                <p className="text-lg font-serif italic text-slate-900 leading-none">
                   {isPlaying ? 'Narrando este artículo...' : '¿Prefieres escuchar la noticia?'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono tabular-nums text-slate-200">{Math.round(progress)}%</span>
              </div>
           </div>

           {/* Progress Bar */}
           <div className="relative pt-2">
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                 <div 
                   className="h-full bg-gradient-to-r from-red-500 to-red-700 transition-all duration-500 ease-out relative" 
                   style={{ width: `${progress}%` }}
                 >
                    <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                 {[1,2,3,4,5].map(i => <div key={i} className={`w-1 h-3 bg-red-600/20 rounded-full ${isPlaying ? 'animate-pulse' : ''}`} style={{ animationDelay: `${i * 0.1}s` }}></div>)}
              </div>
              <p className="text-[11px] font-medium text-slate-400 italic">
                 Voz asistida por IA · Sigue explorando mientras escuchas.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
