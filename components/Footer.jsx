// components/Footer.jsx — Pie de página editorial y moderno
import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="mt-20">
      {/* Footer Primary Navigation (Red Bar - Now at Top of Footer) */}
      <nav className="w-full bg-[#bb1b21] border-t border-black/10 shadow-sm relative z-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
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
        <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16 border-b border-white/10 pb-16">
          
          {/* Logo & Info */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-4 mb-8 group">
              <img src="/icon.png" alt="Logo IP" className="h-14 brightness-0 invert" />
              <span className="text-4xl font-black tracking-[-0.05em] uppercase text-white leading-none">
                Imperio<span className="text-red-600">Público</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 font-serif leading-[1.8] mb-10 italic border-l-2 border-white/5 pl-6">
              {SITE_CONFIG.tagline}. <br/><br/>
              Comprometidos con la integridad informativa y el periodismo de profundidad en la República Dominicana y el mundo.
            </p>
          </div>

          {/* Categories 1 */}
          <div className="md:col-span-1 space-y-8">
            <h4 className="overline-label !text-white/30 italic">Grandes Secciones</h4>
            <ul className="grid grid-cols-1 gap-4">
              {CATEGORIES.slice(0, 5).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} className="metadata-text !text-white/70 hover:!text-red-500 transition-colors uppercase tracking-widest leading-none">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories 2 */}
          <div className="md:col-span-1 space-y-8">
            <h4 className="overline-label !text-white/30 italic">Explora</h4>
            <ul className="grid grid-cols-1 gap-4">
              {CATEGORIES.slice(5, 10).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} className="metadata-text !text-white/70 hover:!text-red-500 transition-colors uppercase tracking-widest leading-none">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="md:col-span-1 space-y-8">
            <h4 className="overline-label !text-white/30 italic">Conexión Directa</h4>
            <div className="space-y-3">
              <p className="metadata-text !text-slate-400 uppercase tracking-widest break-all">vizcainosr29@gmail.com</p>
              <p className="metadata-text !text-slate-400 uppercase tracking-widest break-all">jvizcaino242@gmail.com</p>
            </div>
            <div className="flex gap-4 mt-8">
              {[
                { name: 'FB', url: SITE_CONFIG.social.facebook },
                { name: 'IG', url: SITE_CONFIG.social.instagram },
                { name: 'X',  url: SITE_CONFIG.social.twitter },
                { name: 'YT', url: SITE_CONFIG.social.youtube }
              ].map(s => (
                <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 border border-white/10 flex items-center justify-center hover:bg-black hover:border-red-600 group/social transition-all">
                   <span className="metadata-text !text-white group-hover/social:!text-red-600">{s.name}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center metadata-text !text-slate-600 uppercase border-t border-white/5 pt-12">
           <span className="italic tracking-normal">© {new Date().getFullYear()} {SITE_CONFIG.name}. Todos los derechos reservados.</span>
           <div className="flex gap-8 mt-6 md:mt-0">
              <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
              <Link href="/aviso-legal" className="hover:text-white transition-colors">Aviso Legal</Link>
           </div>
        </div>
      </div>
    </div>
  </footer>
  );
}
