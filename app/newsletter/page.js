'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function NewsletterPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
      setEmail('');
    } catch (_) {
      setStatus('idle');
      alert('Hubo un problema. Por favor intenta de nuevo.');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 md:py-24">
      <div className="max-w-xl mx-auto bg-white p-8 md:p-12 shadow-2xl rounded-sm border border-gray-100">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block mb-8">
            <h1 className="font-serif text-3xl font-black uppercase tracking-tighter">
              Imperio<span className="text-red-700">Público</span>
            </h1>
          </Link>
          <h2 className="text-4xl font-serif font-black mb-4 leading-tight">
            Mantente al tanto de la verdad
          </h2>
          <p className="text-gray-600 font-medium">
            Recibe cada mañana un resumen editorial con las 5 noticias que realmente importan hoy.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-sm text-center animate-fade-in">
            <svg className="w-12 h-12 mx-auto mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-xl font-bold mb-2">¡Suscripción exitosa!</h3>
            <p className="text-sm opacity-90">Te hemos enviado un correo de bienvenida. Revisa tu bandeja de entrada.</p>
            <button 
              onClick={() => setStatus('idle')}
              className="mt-6 text-sm font-bold uppercase tracking-widest text-green-700 hover:underline"
            >
              Suscribir otro correo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                Tu correo electrónico
              </label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 focus:border-red-700 focus:bg-white outline-none transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className={`w-full bg-black text-white font-black uppercase tracking-[0.2em] py-5 transition-all hover:bg-red-700 active:scale-[0.98] ${status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {status === 'loading' ? 'Procesando...' : 'Suscribirme Ahora'}
            </button>
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Al suscribirte, aceptas nuestros Términos y Política de Privacidad. 
              Puedes darte de baja en cualquier momento con un solo clic.
            </p>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-gray-100 flex justify-center gap-6">
          <Link href="/" className="text-[11px] font-bold text-gray-400 hover:text-black uppercase tracking-widest">
            Volver al inicio
          </Link>
          <span className="text-gray-200">|</span>
          <Link href="/privacidad" className="text-[11px] font-bold text-gray-400 hover:text-black uppercase tracking-widest">
            Privacidad
          </Link>
        </div>
      </div>
    </main>
  );
}
