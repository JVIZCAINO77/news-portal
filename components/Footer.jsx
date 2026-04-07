// components/Footer.jsx — Pie de página editorial y moderno
import Link from 'next/link';
import { SITE_CONFIG, CATEGORIES } from '@/lib/data';

export default function Footer() {
  return (
    <footer className="bg-black text-white py-20 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16 border-b border-white/10 pb-16">
          
          {/* Logo & Info */}
          <div className="md:col-span-1">
            <Link href="/" className="text-3xl font-black tracking-tighter uppercase mb-6 inline-block">
              Pulso<span className="text-red-500">Noticias</span>
            </Link>
            <p className="text-sm text-slate-400 font-serif leading-relaxed">
              El Pulso de la Actualidad Dominicana. Líderes en información verificada, inmediata y de alta calidad editorial.
            </p>
          </div>

          {/* Categories 1 */}
          <div className="md:col-span-1 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Secciones</h4>
            <ul className="grid grid-cols-1 gap-2">
              {CATEGORIES.slice(0, 4).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} className="text-sm font-bold uppercase tracking-wider hover:text-red-500 transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories 2 */}
          <div className="md:col-span-1 space-y-4 pt-8 md:pt-0">
             <ul className="grid grid-cols-1 gap-2 mt-4 md:mt-10">
              {CATEGORIES.slice(4).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/categoria/${cat.slug}`} className="text-sm font-bold uppercase tracking-wider hover:text-red-500 transition-colors">
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div className="md:col-span-1 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Contacto</h4>
            <p className="text-sm font-serif text-slate-400">redaccion@pulsonoticias.com</p>
            <div className="flex gap-4 mt-6">
               <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer">
                 <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.74h-2.94v-3.411h2.94v-2.518c0-2.915 1.779-4.5 4.378-4.5 1.244 0 2.316.091 2.628.133v3.047h-1.803c-1.415 0-1.688.672-1.688 1.658v2.17h3.374l-.439 3.411h-2.935v8.74h6.133c.733 0 1.323-.593 1.323-1.325v-21.35c0-.732-.59-1.325-1.325-1.325z"/></svg>
               </span>
               <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer">
                 <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
               </span>
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
    </footer>
  );
}
