export const dynamic = 'force-dynamic';

// app/admin/articulos/page.js — Gestión de Artículos con vista de tarjetas (Imperio Público 2.0)
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DeleteArticleButton from '@/components/DeleteArticleButton';

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  let articles = [];
  let isAdmin = false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Redirigiendo...</div>;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    isAdmin = profile?.role === 'admin';

    let query = supabase.from('articles').select('*').order('publishedAt', { ascending: false });
    if (!isAdmin) query = query.eq('author_id', user.id);

    const { data, error } = await query;
    if (error) throw error;
    articles = data || [];
  } catch (err) {
    console.error('Error loading articles:', err);
    return (
      <div className="p-12 border-2 border-red-500 bg-red-50 text-red-900">
        <h2 className="text-2xl font-black uppercase mb-4">Error de Base de Datos</h2>
        <p className="text-sm">No pudimos cargar los artículos.</p>
        <pre className="mt-4 text-[10px] bg-white p-4 border border-red-200 overflow-auto">{err.message}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter italic">Gestión de Contenido</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
            {isAdmin
              ? `Administrando todo el portal · ${articles.length} artículos`
              : `Tus artículos publicados (${articles.length})`}
          </p>
        </div>
        <Link
          href="/admin/articulos/nuevo"
          className="bg-red-600 text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-colors whitespace-nowrap"
        >
          + Nuevo Artículo
        </Link>
      </div>

      {/* ── STATS RÁPIDAS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: articles.length,                          color: 'bg-black text-white' },
          { label: 'Portada',    value: articles.filter(a => a.featured).length,  color: 'bg-red-600 text-white' },
          { label: 'Impacto',    value: articles.filter(a => a.trending).length,  color: 'bg-slate-800 text-white' },
          { label: 'Sin imagen', value: articles.filter(a => !a.image).length,    color: 'bg-amber-500 text-white' },
        ].map(s => (
          <div key={s.label} className={`${s.color} p-5 flex flex-col gap-1`}>
            <span className="text-3xl font-black">{s.value}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-70">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── GRID DE TARJETAS ── */}
      {articles.length === 0 ? (
        <div className="py-32 text-center border border-dashed border-slate-200">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">No hay artículos publicados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {articles.map(a => {
            const hasImage = !!a.image;
            const date = a.publishedAt
              ? new Date(a.publishedAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: '2-digit' })
              : 'Borrador';

            return (
              <div
                key={a.id}
                className="group bg-white border border-gray-100 hover:border-red-200 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* ── THUMBNAIL ── */}
                <div className="relative w-full h-44 bg-slate-100 flex-shrink-0 overflow-hidden">
                  {hasImage ? (
                    <>
                      <img
                        src={a.image}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      {/* Fallback si la img falla */}
                      <div className="absolute inset-0 bg-slate-900 flex-col items-center justify-center hidden">
                        <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Error imagen</span>
                      </div>
                    </>
                  ) : (
                    /* Sin imagen en BD */
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 text-slate-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Sin imagen</span>
                    </div>
                  )}

                  {/* Badges sobre la imagen */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-0.5">
                      {a.category}
                    </span>
                    {a.trending && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>Impacto
                      </span>
                    )}
                    {a.featured && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-white text-black px-2 py-0.5">
                        Portada
                      </span>
                    )}
                  </div>

                  {/* Fecha bottom-right */}
                  <div className="absolute bottom-3 right-3">
                    <span className="text-[8px] font-black uppercase tracking-widest bg-black/60 text-white px-2 py-0.5 backdrop-blur-sm">
                      {date}
                    </span>
                  </div>
                </div>

                {/* ── CONTENIDO ── */}
                <div className="p-5 flex flex-col flex-1 gap-3">
                  <h3 className="text-sm font-black uppercase tracking-tight text-black leading-tight line-clamp-2 group-hover:text-red-700 transition-colors">
                    {a.title}
                  </h3>

                  {a.excerpt && (
                    <p className="text-[11px] text-slate-400 font-serif italic leading-relaxed line-clamp-2 flex-1">
                      {a.excerpt}
                    </p>
                  )}

                  {isAdmin && a.author && (
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">
                      Por {a.author}
                    </p>
                  )}

                  {/* ── ACCIONES ── */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-50 mt-auto">
                    <Link
                      href={`/articulo/${a.slug}`}
                      target="_blank"
                      className="flex-1 text-center text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 px-3 py-2 hover:bg-slate-50 transition-colors"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/articulos/editar/${a.id}`}
                      className="flex-1 text-center text-[9px] font-black uppercase tracking-widest bg-black text-white px-3 py-2 hover:bg-red-600 transition-colors"
                    >
                      Editar
                    </Link>
                    {isAdmin && <DeleteArticleButton id={a.id} />}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
