// app/admin/usuarios/UserForm.jsx — Formulario de Creación de Usuarios (PulsoNoticias 2.0)
'use client';
import { useState } from 'react';
import { createEditorUser } from './actions';

export default function UserForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(event.target);
    const result = await createEditorUser(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      event.target.reset();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-10 border border-gray-100 shadow-sm space-y-8 h-fit">
      <h3 className="text-xl font-black uppercase tracking-tighter border-b-2 border-black pb-4 mb-8">Añadir Nuevo Miembro</h3>
      
      {success && (
        <div className="bg-green-50 text-green-600 p-4 border-l-4 border-green-600 text-[10px] font-black uppercase tracking-widest animate-pulse">
           ¡Usuario creado y listo para publicar!
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 border-l-4 border-red-600 text-[10px] font-black uppercase tracking-widest">
           {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Nombre Completo</label>
          <input
            name="name"
            type="text"
            className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-sm outline-none focus:border-red-600"
            placeholder="Ej: Juan Pérez"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Correo Electrónico</label>
          <input
            name="email"
            type="email"
            className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-sm outline-none focus:border-red-600"
            placeholder="email@pro.com"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Contraseña Inicial</label>
          <input
            name="password"
            type="password"
            className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-sm outline-none focus:border-red-600"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Procesando...' : 'Registrar Miembro'}
        </button>
      </form>
    </div>
  );
}
