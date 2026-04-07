'use client';
// components/DeleteArticleButton.jsx — Botón de Borrado (PulsoNoticias 2.0)
import { useState } from 'react';
import { deleteArticle } from '@/app/admin/articulos/actions';

export default function DeleteArticleButton({ id }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta noticia? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteArticle(id);
      // La revalidación del servidor actualizará la lista
    } catch (error) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      className={`p-2 transition-colors ${loading ? 'text-slate-200' : 'text-slate-400 hover:text-red-600'}`}
      title="Eliminar Artículo"
    >
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 6l3 18h12l3-18h-18zm19-4h-5.414l-1.586-2h-6l-1.586 2h-5.414v4h19v-4z"/>
      </svg>
    </button>
  );
}
