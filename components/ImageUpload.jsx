'use client';
import { useState } from 'react';
import { uploadToCloudinary } from '@/lib/upload';

/**
 * ImageUpload — Componente premium para subir imágenes a Cloudinary
 * @param {string} value - La URL de la imagen actual
 * @param {function} onChange - Callback cuando la imagen cambia (recibe la URL)
 * @param {string} label - Texto de la etiqueta
 * @param {function} onInsertToContent - Callback para insertar sintaxis Markdown en el contenido
 */
export default function ImageUpload({ value, onChange, label = "Imagen Destacada", onInsertToContent }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      console.error('Upload Error:', err);
      alert('Error al subir la imagen. Verifica la configuración de Cloudinary.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!value) return;
    const syntax = `![Descripción de la imagen](${value})`;
    navigator.clipboard.writeText(syntax).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
    if (onInsertToContent) onInsertToContent(syntax);
  };

  return (
    <div className="space-y-4">
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </label>

      <div className="relative group">
        {value ? (
          <div className="relative aspect-video overflow-hidden border-2 border-slate-100 group-hover:border-red-600 transition-all">
            <img src={value} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <label className="cursor-pointer bg-white text-black px-6 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-red-600 hover:text-white transition-all">
                Cambiar Foto
                <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={loading} />
              </label>
              <button 
                type="button"
                onClick={() => onChange('')}
                className="bg-black text-white px-6 py-2 text-[10px] font-black uppercase tracking-wider hover:bg-red-600 transition-all"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-white hover:border-red-600 transition-all cursor-pointer">
            <div className="text-center space-y-2">
              <svg className="w-8 h-8 mx-auto text-slate-300 group-hover:text-red-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-black">Subir Imagen Local</span>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={loading} />
          </label>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-20">
             <div className="w-12 h-12 border-4 border-black border-t-red-600 rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Procesando imagen...</p>
          </div>
        )}
      </div>

      <div className="pt-2">
        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-300 mb-2">O pega una URL externa</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-[10px] outline-none focus:border-red-600 transition-all"
        />
      </div>

      {/* Botón para insertar en el cuerpo del artículo */}
      {value && (
        <button
          type="button"
          onClick={handleCopyMarkdown}
          className={`w-full py-3 text-[9px] font-black uppercase tracking-[0.3em] transition-all border-2 flex items-center justify-center gap-2 ${
            copied
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-black hover:text-black'
          }`}
        >
          {copied ? (
            <>✓ ¡Copiado al Portapapeles!</>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar sintaxis para el Cuerpo
            </>
          )}
        </button>
      )}
    </div>
  );
}

