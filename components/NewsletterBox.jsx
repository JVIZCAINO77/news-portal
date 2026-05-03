// components/NewsletterBox.jsx — Bloque de suscripción Imperio Diario
'use client';
import { useState } from 'react';
import { trackNewsletterSignup } from '@/lib/analytics';

export default function NewsletterBox({ variant = 'default' }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    
    // Simulación de éxito
    setTimeout(() => {
      setStatus('success');
      setEmail('');
      trackNewsletterSignup('Newsletter Box');
    }, 1200);
  };

  if (status === 'success') {
    return (
      <div className="bg-[#bb1b21] p-8 md:p-16 text-center text-white animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
           <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
           </svg>
        </div>
        <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">¡Bienvenido al Imperio!</h3>
        <p className="text-white/80 text-sm font-bold uppercase tracking-widest max-w-md mx-auto leading-relaxed">
          Ya estás en nuestra lista VIP. El resumen de las 6:00 AM llegará mañana a tu correo.
        </p>
      </div>
    );
  }

  return (
    <section className={`bg-[#bb1b21] overflow-hidden relative group ${variant === 'compact' ? 'p-6' : 'p-10 md:p-20'}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none select-none overflow-hidden">
         <span className="text-[15rem] font-black absolute -bottom-10 -right-10 leading-none tracking-tighter">IMPERIO</span>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center text-center">
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-white/60 mb-6 block italic">
          Imperio Diario · Newsletter
        </span>
        <h2 className={`font-black text-white uppercase tracking-tighter mb-8 italic ${variant === 'compact' ? 'text-2xl leading-tight' : 'text-4xl md:text-6xl leading-[0.9]'}`}>
          Mantente en el centro de la información
        </h2>
        <p className={`text-white/80 font-serif italic mb-12 max-w-2xl leading-relaxed ${variant === 'compact' ? 'text-sm' : 'text-lg md:text-xl'}`}>
           Recibe cada mañana el resumen editorial con las 5 noticias que realmente importan hoy.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-lg flex flex-col md:flex-row gap-4">
           <input 
             type="email" 
             placeholder="Tu correo electrónico..."
             required
             value={email}
             onChange={(e) => setEmail(e.target.value)}
             className="flex-1 bg-white border-2 border-transparent focus:border-black p-4 text-black text-sm font-bold placeholder:text-slate-400 outline-none transition-all uppercase tracking-wider"
           />
           <button 
             type="submit" 
             disabled={status === 'loading'}
             className="bg-black text-white px-10 py-4 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-slate-900 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
           >
             {status === 'loading' ? 'Procesando...' : 'Suscribirme'}
           </button>
        </form>
        <p className="mt-8 text-[9px] font-bold text-white/40 uppercase tracking-widest">
           Sin spam. Solo periodismo de impacto. Cancela cuando quieras.
        </p>
      </div>
    </section>
  );
}
