'use client';
// components/DeleteArticleButton.jsx — Botón de Borrado Premium (PulsoNoticias 2.0)
import { useState } from 'react';
import { deleteArticle } from '@/app/admin/articulos/actions';

export default function DeleteArticleButton({ id }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setLoading(true);
    try {
      const result = await deleteArticle(id);
      if (result.success) {
        // La revalidación del servidor actualizará la lista automáticamente
      }
    } catch (error) {
      console.error('[DeleteButton] Error:', error);
      alert(`Error al borrar: ${error.message}`);
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const cancelDelete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div className="relative flex items-center gap-2">
      {showConfirm && !loading && (
        <button
          onClick={cancelDelete}
          className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-black px-2 py-1 bg-slate-100 rounded transition-colors"
        >
          No
        </button>
      )}
      
      <button 
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all duration-300 rounded flex items-center gap-2 
          ${loading ? 'opacity-30 cursor-not-allowed bg-slate-100' : 
            showConfirm ? 'bg-red-600 text-white hover:bg-black' : 
            'text-slate-400 hover:text-red-600 hover:bg-red-50'}`}
        title={showConfirm ? "Confirmar Borrado" : "Eliminar Artículo"}
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-red-600 border-t-transparent animate-spin rounded-full block"></span>
            <span>Borrando...</span>
          </>
        ) : showConfirm ? (
          "¿BORRAR SI?"
        ) : (
          <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 6l3 18h12l3-18h-18zm19-4h-5.414l-1.586-2h-6l-1.586 2h-5.414v4h19v-4z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
