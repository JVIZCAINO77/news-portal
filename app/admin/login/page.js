// app/admin/login/page.js — Admin Login for PulsoNoticias 2.0
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/admin');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white shadow-2xl p-10 border-t-8 border-red-600">
        <div className="text-center mb-10">
           <h1 className="text-3xl font-black uppercase tracking-tighter text-black mb-2">
             Pulso<span className="text-red-600">Admin</span>
           </h1>
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Control de Acceso Editorial</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 mb-6 text-xs font-bold border-l-4 border-red-600 uppercase tracking-widest">
            {error === 'Invalid login credentials' ? 'Credenciales Inválidas' : error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-100 focus:outline-none focus:border-red-600 font-bold text-sm"
              placeholder="admin@pulsonoticias.com"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-100 focus:outline-none focus:border-red-600 font-bold text-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Entrar al Panel'}
          </button>
        </form>

        <div className="mt-10 pt-10 border-t border-gray-100 text-center">
           <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest leading-relaxed">
             Si has olvidado tus credenciales o necesitas acceso, contacta al administrador del sistema.
           </p>
        </div>
      </div>
    </div>
  );
}
