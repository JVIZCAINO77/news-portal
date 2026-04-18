'use client';
// components/AudioReader.jsx — Lector de Artículos con Voz de IA (Nativo)
import { useState, useEffect, useRef } from 'react';

export default function AudioReader({ title, text }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const utteranceRef = useRef(null);

  const cleanText = (rawText) => {
    return rawText
      .replace(/##/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/---/g, '')
      .replace(/#\w+/g, '');
  };

  const startReading = () => {
    if (typeof window === 'undefined') return;

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      setIsPaused(false);
      return;
    }

    // Stop anything else first
    window.speechSynthesis.cancel();

    const fullText = `${title}. ${cleanText(text)}`;
    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = 'es-ES'; // Prefer Spanish
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
      // Cleanup on unmount
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div className="bg-background border border-border-base p-6 mb-[3px] flex flex-col md:flex-row items-center gap-6 shadow-sm">
      <div className="flex items-center gap-4">
        {!isPlaying || isPaused ? (
          <button 
            onClick={startReading}
            className="w-16 h-16 bg-foreground text-background flex items-center justify-center hover:bg-accent transition-colors shadow-lg active:scale-95"
            aria-label="Escuchar artículo"
          >
            <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
            </svg>
          </button>
        ) : (
          <button 
            onClick={pauseReading}
            className="w-16 h-16 bg-foreground text-background flex items-center justify-center hover:bg-accent transition-colors shadow-lg active:scale-95"
            aria-label="Pausar lectura"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        )}
        
        {isPlaying && (
           <button 
            onClick={stopReading}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 transition-colors"
           >
             Detener
           </button>
        )}
      </div>

      <div className="flex-1 w-full">
         <div className="flex justify-between items-end mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
               {isPlaying ? '● Escuchando este artículo' : '¿Prefieres escuchar?'}
            </p>
            <p className="text-[10px] font-mono text-red-600 font-bold">{Math.round(progress)}%</p>
         </div>
         <div className="h-1 w-full bg-slate-200 dark:bg-zinc-800 overflow-hidden relative">
            <div 
              className="h-full bg-red-600 transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
         </div>
         <p className="mt-3 text-[10px] font-bold text-slate-400 italic leading-tight">
            Voz asistida por el navegador · Puedes seguir haciendo scroll mientras escuchas.
         </p>
      </div>
    </div>
  );
}
