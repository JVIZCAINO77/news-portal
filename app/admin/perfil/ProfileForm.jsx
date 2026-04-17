'use client';
import { useState, useRef } from 'react';
import { updateProfile } from './actions';

export default function ProfileForm({ profile }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(profile?.avatar_url || '');
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  async function handleSubmit(formData) {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="max-w-2xl bg-white border border-gray-100 p-8 md:p-12 shadow-sm animate-in fade-in duration-700">
      <h2 className="text-2xl font-black uppercase tracking-tighter mb-10 border-b-4 border-black pb-4 inline-block">
        Configuración de Perfil
      </h2>

      {/* Avatar Section */}
      <div className="flex flex-col md:flex-row gap-10 items-center mb-12 bg-slate-50 p-8 border border-gray-100">
        <div className="relative group">
          {preview ? (
            <img 
              src={preview} 
              alt="Preview" 
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl group-hover:opacity-75 transition-all" 
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-red-600 flex items-center justify-center text-white text-4xl font-black shadow-xl group-hover:bg-red-700 transition-all">
              {profile?.full_name?.charAt(0) || '?'}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            <span className="text-[8px] font-black uppercase text-white bg-black px-2 py-1">Cambiar</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 block">Foto de Identidad</label>
          <input 
            type="file" 
            name="avatar" 
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            className="text-[10px] font-bold text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-black file:text-white hover:file:bg-red-600 cursor-pointer w-full"
          />
          <p className="text-[9px] text-gray-400 italic">Recomendado: Imagen cuadrada, min. 400x400px</p>
        </div>
      </div>

      {/* Hidden field for avatar url */}
      <input type="hidden" name="currentAvatarUrl" value={profile?.avatar_url || ''} />

      <div className="space-y-8">
        <div>
          <label className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 block mb-3 italic">Nombre de Firma Editorial</label>
          <input 
            type="text" 
            name="fullName" 
            defaultValue={profile?.full_name || ''} 
            required 
            placeholder="Ej: Jose Bizcaino"
            className="w-full bg-slate-50 border-0 border-b-2 border-gray-200 focus:border-red-600 outline-none p-4 text-lg font-bold transition-all placeholder:opacity-30"
          />
          <p className="text-[9px] text-gray-400 mt-2">Este nombre aparecerá públicamente en todos tus artículos.</p>
        </div>

        <div>
           <label className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 block mb-3 italic">Correo Electrónico</label>
           <input 
             type="email" 
             value={profile?.email || ''} 
             disabled
             className="w-full bg-gray-50 border-0 border-b-2 border-gray-100 p-4 text-lg font-bold text-gray-400 cursor-not-allowed"
           />
           <p className="text-[9px] text-gray-300 mt-2">El correo es administrado por el equipo técnico.</p>
        </div>
      </div>

      {error && (
        <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest text-center animate-shake">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest text-center">
          ✓ Perfil actualizado correctamente
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center">
        <div className="text-[9px] font-bold uppercase text-slate-300 tracking-widest">
           ID: {profile?.id?.slice(0, 8)}...
        </div>
        <button 
          disabled={loading}
          className="bg-black text-white px-10 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-600 transition-all disabled:opacity-50 shadow-lg active:scale-95"
        >
          {loading ? 'Sincronizando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}
