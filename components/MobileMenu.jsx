// components/MobileMenu.jsx — Panel Lateral Premium para Móvil
'use client';
import Link from 'next/link';
import { CATEGORIES, SITE_CONFIG } from '@/lib/data';

export default function MobileMenu({ isOpen, onClose, tickerItems = [] }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop con Blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in"
        onClick={onClose}
      ></div>

      {/* Drawer Panel */}
      <aside className="absolute top-0 left-0 w-4/5 max-w-[320px] h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-left duration-500">
        {/* Header del Menú */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
           <div className="flex flex-col">
            <span className="text-xl font-black text-black uppercase tracking-tighter leading-none font-serif">Imperio<span className="text-red-600">Público</span></span>
            <span className="text-[7px] font-black uppercase tracking-[0.4em] text-slate-400 mt-1">La Autoridad</span>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-black hover:bg-slate-100 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto py-8">
          <nav className="px-6 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-8 border-b-2 border-red-600 inline-block italic">Navegación</p>
            <ul className="space-y-4">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <Link 
                    href={`/categoria/${cat.slug}`} 
                    onClick={onClose}
                    className="text-xl font-black text-slate-400 hover:text-black transition-colors uppercase tracking-tight flex items-center justify-between group"
                  >
                    {cat.label}
                    <span className="text-[10px] opacity-0 group-hover:opacity-50 group-hover:translate-x-1 transition-all">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Sección de Servicio en Móvil */}
          <div className="mt-12 px-6 pt-12 border-t border-gray-100">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6 italic">Utilidades</p>
             <div className="bg-slate-50 p-6 rounded-sm space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Dólar USD</span>
                   <span className="text-xs font-black text-black">C: <span className="text-red-600">59.85</span> / V: <span className="text-red-600">61.20</span></span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Santo Domingo</span>
                   <span className="text-xs font-black text-black">29°C · Soleado</span>
                </div>
             </div>
          </div>
        </div>

        {/* Footer del Menú */}
        <div className="p-6 bg-black text-white">
           <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/40 mb-4 opacity-50">Conecta con Nosotros</p>
           <div className="flex gap-4">
             <a href={SITE_CONFIG.social.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">FB</a>
             <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">IG</a>
             <a href={SITE_CONFIG.social.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">X</a>
             <a href={SITE_CONFIG.social.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">YT</a>
           </div>
        </div>
      </aside>
    </div>
  );
}
