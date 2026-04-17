// components/BreakingTicker.jsx — Cintillo de Último Minuto dinámico
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BreakingTicker({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <div className="bg-white border-y border-gray-100 overflow-hidden select-none">
      <div className="max-w-6xl mx-auto flex items-center h-10 md:h-12">
        {/* Label Fijo */}
        <div className="bg-black text-white px-4 md:px-6 h-full flex items-center justify-center relative z-10 shadow-[8px_0_12px_rgba(0,0,0,0.1)]">
           <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] whitespace-nowrap animate-pulse italic">
             Último Minuto
           </span>
        </div>

        {/* Contenedor del Marquee */}
        <div className="flex-1 relative overflow-hidden flex items-center h-full">
          <div className="flex animate-marquee whitespace-nowrap gap-12 items-center hover:[animation-play-state:paused] h-full">
            {/* Duplicamos los items para un scroll infinito suave */}
            {[...items, ...items].map((item, idx) => (
              <Link 
                key={`${item.id}-${idx}`}
                href={`/articulo/${item.slug}`}
                className="inline-flex items-center gap-4 group h-full whitespace-nowrap"
              >
                <span className="w-1.5 h-1.5 bg-black rounded-full opacity-20 flex-shrink-0"></span>
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-tight text-black group-hover:underline whitespace-nowrap">
                  {item.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
