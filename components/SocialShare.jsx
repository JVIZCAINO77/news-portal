'use client';
// components/SocialShare.jsx — Herramientas de Viralidad / Compartir
import { useState, useEffect } from 'react';

export default function SocialShare({ url, title }) {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const channels = [
    {
      name: 'WhatsApp',
      icon: (
        <div className="relative">
          <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          <span className="absolute inset-0 bg-emerald-500/20 blur-lg rounded-full animate-pulse scale-150"></span>
        </div>
      ),
      href: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
      color: 'text-emerald-500 hover:scale-135'
    },
    {
      name: 'Facebook',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-600'
    },
    {
      name: 'X',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" />
        </svg>
      ),
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: 'hover:text-black dark:hover:text-white'
    }
  ];

  return (
    <>
      {/* Desktop Sticky Share (Left) */}
      <div className="hidden xl:flex fixed left-10 top-1/2 -translate-y-1/2 flex-col items-center gap-6 z-50 bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 shadow-xl">
         <p className="text-[8px] font-black uppercase vertical-text tracking-widest text-slate-500 mb-4 select-none">Impacto Social</p>
         <div className="flex flex-col gap-6">
            {channels.map((ch) => (
              <a 
                key={ch.name} 
                href={ch.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`text-slate-400 transition-all duration-300 transform ${ch.color}`}
                aria-label={`Compartir en ${ch.name}`}
              >
                {ch.icon}
              </a>
            ))}
            <div className="h-px w-6 bg-slate-200/20 my-2 self-center"></div>
            <button 
              onClick={copyToClipboard}
              className={`text-slate-400 transition-all duration-300 transform hover:scale-125 ${copied ? 'text-emerald-500' : 'hover:text-red-600'}`}
              aria-label="Copiar enlace"
            >
              {copied ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              )}
            </button>
         </div>
      </div>

      {/* Mobile Sticky Share (Bottom) */}
      <div className="xl:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full z-[100] px-8 py-3 transition-all duration-500">
         <div className="flex justify-between items-center gap-10">
            {channels.map((ch) => (
              <a 
                key={ch.name} 
                href={ch.href} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`transition-all duration-300 ${ch.name === 'WhatsApp' ? 'text-emerald-500 scale-125' : 'text-white/60'}`}
                aria-label={ch.name}
              >
                {ch.icon}
              </a>
            ))}
            <div className="w-px h-4 bg-white/10"></div>
            <button 
              onClick={copyToClipboard}
              className={`text-[9px] font-black uppercase tracking-widest transition-all ${copied ? 'text-emerald-400' : 'text-white'}`}
              aria-label="Copiar enlace al portapapeles"
            >
              {copied ? 'Listo' : 'Link'}
            </button>
         </div>
      </div>

      <style jsx>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          transform: rotate(180deg);
        }
      `}</style>
    </>
  );
}
