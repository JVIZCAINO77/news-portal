// components/Footer.jsx — Pie de página editorial y moderno
import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="mt-20">
      {/* Footer Primary Navigation (Red Bar - Now at Top of Footer) */}
      <nav className="w-full bg-[#bb1b21] border-t border-black/10 shadow-sm relative z-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar gap-1 py-2">
            {CATEGORIES.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/categoria/${cat.slug}`}
                  className="px-3 md:px-4 py-3 text-[10px] font-black uppercase tracking-[0.15em] text-white/90 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="bg-black text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16 border-b border-white/10 pb-16">
          
          {/* Logo & Info */}
          <div className="md:col-span-1">
            <Link href="/" className="inline-block mb-6 group">
              <img src="/logo.png" alt={SITE_CONFIG.name} className="h-16 md:h-20 lg:h-24 brightness-0 invert" />
            </Link>
            <p className="text-xs text-slate-400 font-serif leading-relaxed mb-8">
              {SITE_CONFIG.tagline}. <br/><br/>
              Comprometidos con la integridad informativa y el periodismo de profundidad en la República Dominicana y el mundo.
            </p>
          </div>

          {/* Categories 1 */}
          <div className="md:col-span-1 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Grandes Secciones</h4>
            <ul className="grid grid-cols-1 gap-3">
              {CATEGORIES.slice(0, 5).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} className="text-[11px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories 2 */}
          <div className="md:col-span-1 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Más Información</h4>
            <ul className="grid grid-cols-1 gap-3">
              {CATEGORIES.slice(5, 10).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} className="text-[11px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="md:col-span-1 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">Conexión Directa</h4>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest break-all">vizcainosr29@gmail.com</p>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest break-all">jvizcaino242@gmail.com</p>
            </div>
            <div className="flex gap-3 mt-4">
               {[1, 2, 3].map(i => (
                 <span key={i} className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all cursor-pointer">
                    <span className="text-[10px] font-black uppercase">S{i}</span>
                 </span>
               ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
           <span>© {new Date().getFullYear()} {SITE_CONFIG.name}. Todos los derechos reservados.</span>
           <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacidad" className="hover:text-white">Privacidad</Link>
              <Link href="/aviso-legal" className="hover:text-white">Aviso Legal</Link>
           </div>
        </div>
      </div>
    </div>
  </footer>
  );
}
