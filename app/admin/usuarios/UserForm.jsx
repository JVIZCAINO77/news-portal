// app/admin/usuarios/UserForm.jsx — Formulario de Creación de Usuarios (Imperio Público 2.0)
'use client';
import { useState, useRef } from 'react';
import { createEditorUser } from './actions';

export default function UserForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

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
      setAvatarPreview(null);
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

        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-dashed border-gray-200 hover:border-red-600 transition-all group bg-slate-50 flex items-center justify-center"
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-gray-300 group-hover:text-red-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[8px] font-black uppercase tracking-widest">Cambiar</span>
            </div>
          </button>
          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Foto de perfil (opcional)</span>
          <input
            ref={fileInputRef}
            name="avatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>

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
