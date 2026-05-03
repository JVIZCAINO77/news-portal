// components/MobileMenu.jsx — Panel Lateral Premium para Móvil
'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES, SITE_CONFIG } from '@/lib/data';

export default function MobileMenu({ isOpen, onClose, tickerItems = [] }) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery('');
    }
  };

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
        <div className="flex-1 overflow-y-auto pt-4 pb-8">
          {/* Mobile Search Bar Integrated */}
          <div className="px-6 mb-8 mt-2">
            <form onSubmit={handleSearch} className="relative">
              <input 
                autoFocus
                type="text"
                placeholder="INVESTIGAR NOTICIA..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-slate-100/80 border-b-2 border-transparent focus:border-red-600 outline-none p-4 text-[11px] font-black uppercase tracking-widest transition-all placeholder:text-slate-400"
              />
              <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-black">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>

          <nav className="px-6 space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 mb-8 border-b-2 border-red-600 inline-block italic">Navegación</p>
            <ul className="space-y-4">
              {CATEGORIES.filter(cat => cat.slug !== 'noticias').map((cat) => (
                <li key={cat.slug}>
                  <Link 
                    href={`/categoria/${cat.slug}`} 
                    onClick={onClose}
                    className="text-xl font-black text-slate-400 hover:text-black transition-colors tracking-tight flex items-center justify-between group"
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
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-6 italic">Edición Digital</p>
             <div className="bg-slate-50 p-6 rounded-sm space-y-4">
                <div className="flex justify-between items-center">
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">RSS Feed</span>
                   <a href="/feed.xml" className="text-xs font-black text-red-600 hover:underline">Suscribirse</a>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Newsletter</span>
                   <a href="/newsletter" onClick={onClose} className="text-xs font-black text-red-600 hover:underline">Unirse</a>
                </div>
             </div>
          </div>
        </div>

        {/* Footer del Menú */}
        <div className="p-6 bg-black text-white">
           <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/40 mb-4 opacity-50">Conecta con Nosotros</p>
           <div className="flex gap-4">
             {[
               { name: 'FB', url: SITE_CONFIG.social.facebook, icon: (<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>) },
               { name: 'IG', url: SITE_CONFIG.social.instagram, icon: (<><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>) },
               { name: 'X',  url: SITE_CONFIG.social.twitter, icon: (<path d="M4 4l11.733 16h4.267l-11.733-16z M4 20l6.768-8.505 M20 4l-6.768 8.505"/>) },
               { name: 'YT', url: SITE_CONFIG.social.youtube, icon: (<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z M9.75 15.02V8.98L15.36 12l-5.61 3.02z"/>) },
               { name: 'WA', url: `https://wa.me/${SITE_CONFIG.social.whatsapp}`, icon: (<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />) }
             ].map(s => (
               <a 
                 key={s.name} 
                 href={s.url} 
                 target="_blank" 
                 rel="noopener noreferrer" 
                 className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all group" 
                 aria-label={s.name}
               >
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                   {s.icon}
                 </svg>
               </a>
             ))}
           </div>
        </div>
      </aside>
    </div>
  );
}
