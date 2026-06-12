'use client';
// components/AdminArticleCard.jsx — Tarjeta de artículo para el panel admin (Client Component)
import Link from 'next/link';
import { useState } from 'react';
import DeleteArticleButton from './DeleteArticleButton';

// ── Botón de Publicar en Redes Sociales ──
function SocialPublishButton({ articleId }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [msg, setMsg]       = useState('');

  async function handlePublish() {
    if (status === 'loading') return;
    setStatus('loading');
    setMsg('');
    try {
      const res = await fetch('/api/admin/post-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setMsg(data.message || 'Publicado en redes.');
        // Reset después de 4 segundos
        setTimeout(() => setStatus('idle'), 4000);
      } else {
        setStatus('error');
        setMsg(data.error || 'Error al publicar.');
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch (e) {
      setStatus('error');
      setMsg('Error de red.');
      setTimeout(() => setStatus('idle'), 4000);
    }
  }

  const styles = {
    idle:    'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700',
    loading: 'bg-slate-300 text-slate-500 cursor-not-allowed',
    success: 'bg-green-600 text-white',
    error:   'bg-red-600 text-white',
  };

  const labels = {
    idle:    '📢 Publicar en Redes',
    loading: '⏳ Publicando...',
    success: '✅ Publicado',
    error:   '❌ Error',
  };

  return (
    <div className="w-full mt-1">
      <button
        onClick={handlePublish}
        disabled={status === 'loading'}
        className={`w-full text-[9px] font-black uppercase tracking-widest px-3 py-2 transition-all ${styles[status]}`}
        title={msg || 'Publicar este artículo en Facebook e Instagram ahora'}
      >
        {labels[status]}
      </button>
      {msg && status !== 'idle' && (
        <p className={`text-[8px] font-bold mt-1 text-center leading-tight ${
          status === 'success' ? 'text-green-600' : 'text-red-500'
        }`}>
          {msg.slice(0, 120)}
        </p>
      )}
    </div>
  );
}

function ArticleThumb({ image, title }) {
  const [imgError, setImgError] = useState(false);

  const placeholder = (
    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center">
      <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Sin imagen</span>
    </div>
  );

  if (!image || imgError) return placeholder;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={title || ''}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setImgError(true)}
    />
  );
}

export default function AdminArticleCard({ article, isAdmin }) {
  let date = 'Sin fecha';
  try {
    if (article.publishedAt) {
      date = new Date(article.publishedAt).toLocaleDateString('es-DO', {
        day: '2-digit', month: 'short', year: '2-digit'
      });
    }
  } catch (_) {}

  return (
    <div className="group bg-white border border-gray-100 hover:border-red-200 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      {/* ── THUMBNAIL ── */}
      <div className="relative w-full h-44 bg-slate-100 flex-shrink-0 overflow-hidden">
        <ArticleThumb image={article.image} title={article.title} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {article.category && (
            <span className="text-[8px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-0.5">
              {article.category}
            </span>
          )}
          {article.trending && (
            <span className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 flex items-center gap-1">
              <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>Impacto
            </span>
          )}
          {article.featured && (
            <span className="text-[8px] font-black uppercase tracking-widest bg-white text-black px-2 py-0.5">
              Portada
            </span>
          )}
        </div>

        {/* Fecha */}
        <div className="absolute bottom-3 right-3">
          <span className="text-[8px] font-black uppercase tracking-widest bg-black/60 text-white px-2 py-0.5 backdrop-blur-sm">
            {date}
          </span>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        <h3 className="text-sm font-black uppercase tracking-tight text-black leading-tight line-clamp-2 group-hover:text-red-700 transition-colors">
          {article.title || 'Sin título'}
        </h3>

        {article.excerpt && (
          <p className="text-[11px] text-slate-400 font-serif italic leading-relaxed line-clamp-2 flex-1">
            {article.excerpt}
          </p>
        )}

        {isAdmin && article.author && (
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
            Por {article.author}
          </p>
        )}

        {/* ── ACCIONES ── */}
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-50 mt-auto">
          <div className="flex items-center gap-2">
            <Link
              href={`/articulo/${article.slug || ''}`}
              target="_blank"
              className="flex-1 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 px-3 py-2 hover:bg-slate-50 transition-colors"
            >
              Ver
            </Link>
            <Link
              href={`/admin/articulos/editar/${article.id}`}
              className="flex-1 text-center text-[9px] font-black uppercase tracking-widest bg-black text-white px-3 py-2 hover:bg-red-600 transition-colors"
            >
              Editar
            </Link>
            {isAdmin && <DeleteArticleButton id={article.id} />}
          </div>
          {/* Botón de publicación manual en redes — solo admins */}
          {isAdmin && <SocialPublishButton articleId={article.id} />}
        </div>
      </div>
    </div>
  );
}
