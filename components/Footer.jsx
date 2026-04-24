import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="mt-[1px] border-t border-gray-200">
      <div className="bg-black text-white pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            
            {/* Columna 1: Branding y Social (Ancho 4/12) */}
            <div className="lg:col-span-4 flex flex-col items-center lg:items-start text-center lg:text-left">
              <Link href="/" className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white p-1.5 rounded-md shadow-sm flex items-center justify-center">
                    <img src="/logo.png" alt="Logo Imperio Público" className="h-10 md:h-12 object-contain" />
                  </div>
                  <span className="text-2xl md:text-3xl font-black tracking-[-0.05em] text-white leading-none font-serif">
                    Imperio<span className="text-red-600">Público</span>
                  </span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70 leading-tight">
                   LA AUTORIDAD DE LA ACTUALIDAD
                </p>
              </Link>
              
              <div className="w-16 h-px bg-white/10 my-6"></div> {/* Línea Divisora */}

              <div className="space-y-2 text-[11px] font-bold text-white/80 uppercase tracking-widest leading-relaxed">
                <p>Medio Digital Imperio Público.</p>
                <p>Santo Domingo, R.D.</p>
                <p>Tel: (829) 637-1008</p>
              </div>

              <div className="w-16 h-px bg-white/10 my-6"></div> {/* Línea Divisora */}

              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-white/70 max-w-[200px] leading-relaxed">
                Copyright © {new Date().getFullYear()} IMPERIO PÚBLICO | Todos los derechos reservados.
              </p>

              <div className="w-16 h-px bg-white/10 my-6"></div> {/* Línea Divisora */}

              {/* Redes Sociales con ICONOS REALES */}
              <div className="flex gap-4">
                {[
                  { name: 'FB', url: SITE_CONFIG.social.facebook, icon: (<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>) },
                  { name: 'X',  url: SITE_CONFIG.social.twitter, icon: (<path d="M4 4l11.733 16h4.267l-11.733-16z M4 20l6.768-8.505 M20 4l-6.768 8.505"/>) },
                  { name: 'WA', url: `https://wa.me/${SITE_CONFIG.social.whatsapp}`, icon: (<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>) },
                  { name: 'YT', url: SITE_CONFIG.social.youtube, icon: (<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.14 1 12 1 12s0 3.86.42 5.58a2.78 2.78 0 0 0 1.94 2c1.72.42 8.6.42 8.6.42s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.86 23 12 23 12s0-3.86-.42-5.58z M9.75 15.02V8.98L15.36 12l-5.61 3.02z"/>) },
                  { name: 'IG', url: SITE_CONFIG.social.instagram, icon: (<><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>) }
                ].map(s => (
                  <a 
                    key={s.name} 
                    href={s.url} 
                    target="_blank" 
                    className="w-10 h-10 border border-white/20 rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all group"
                  >
                     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        {s.icon}
                     </svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Columnas 2 y 3: MAPA WEB (Ancho 5/12) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-8">
              <div className="col-span-2">
                 <h4 className="text-[13px] font-black uppercase tracking-[0.3em] text-white mb-8">MAPA WEB</h4>
              </div>
              <ul className="space-y-4">
                <li key="inicio"><Link href="/" className="text-[12px] font-bold text-white/60 hover:text-red-600 transition-colors">Inicio</Link></li>
                {CATEGORIES.filter(cat => cat.slug !== 'noticias').slice(0, 7).map(cat => (
                  <li key={cat.slug}>
                    <Link href={`/categoria/${cat.slug}`} className="text-[12px] font-bold text-white/50 hover:text-red-600 transition-colors">
                      {cat.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="space-y-4 pt-0">
                {CATEGORIES.filter(cat => cat.slug !== 'noticias').slice(7, 14).map(cat => (
                  <li key={cat.slug}>
                    <Link href={`/categoria/${cat.slug}`} className="text-[12px] font-bold text-white/50 hover:text-red-600 transition-colors">
                      {cat.label}
                    </Link>
                  </li>
                ))}
                <li key="sitemap"><Link href="/sitemap.xml" className="text-[12px] font-bold text-white/50 hover:text-red-600 transition-colors">Sitemap</Link></li>
              </ul>
            </div>

            {/* Columna 4: NOSOTROS (Ancho 3/12) */}
            <div className="lg:col-span-3">
              <h4 className="text-[13px] font-black uppercase tracking-[0.3em] text-white mb-8">NOSOTROS</h4>
              <ul className="space-y-4">
                <li key="contacto"><Link href="/contacto" className="text-[12px] font-bold text-white/60 hover:text-red-600 transition-colors uppercase">Para contactarnos</Link></li>
                <li key="nosotros"><Link href="/nosotros" className="text-[12px] font-bold text-white/50 hover:text-red-600 transition-colors uppercase">Historia</Link></li>
                <li key="mision"><Link href="/mision" className="text-[12px] font-bold text-white/50 hover:text-red-600 transition-colors uppercase">Misión, visión, valores</Link></li>
                <li key="legal"><Link href="/aviso-legal" className="text-[12px] font-bold text-white/50 hover:text-red-600 transition-colors uppercase">Aviso Legal</Link></li>
                <li key="privacidad"><Link href="/privacidad" className="text-[12px] font-bold text-white/50 hover:text-red-600 transition-colors uppercase">Política de privacidad</Link></li>
              </ul>
            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
