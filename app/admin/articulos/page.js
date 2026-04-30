// app/admin/articulos/page.js — Gestión de Artículos (Imperio Público 2.0)
export const dynamic = 'force-dynamic';

import Link from 'next/link';
import AdminArticleCard from '@/components/AdminArticleCard';
import { createClient } from '@supabase/supabase-js';

export default async function AdminArticlesPage() {
  let articles = [];
  let isAdmin = false;
  let errorMsg = null;

  try {
    // Auth via server client (cookies)
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    const { data: authData } = await supabase.auth.getUser();

    const userId = authData?.user?.id;

    if (!userId) {
      return (
        <div className="py-32 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Sesión no válida.{' '}
            <a href="/admin/login" className="text-red-600 underline">
              Iniciar sesión
            </a>
          </p>
        </div>
      );
    }

    // Datos con service role — no depende de cookies ni RLS
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    isAdmin = profile?.role === 'admin';

    let query = admin
      .from('articles')
      .select('id, slug, title, excerpt, image, category, author, publishedAt, featured, trending, author_id')
      .order('publishedAt', { ascending: false })
      .limit(200);

    if (!isAdmin) query = query.eq('author_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    articles = data || [];

  } catch (err) {
    console.error('[AdminArticulos] Error:', err);
    errorMsg = err?.message || 'Error desconocido';
  }

  if (errorMsg) {
    return (
      <div className="p-12 border-2 border-red-500 bg-red-50 text-red-900">
        <h2 className="text-2xl font-black uppercase mb-4">Error de Carga</h2>
        <pre className="mt-2 text-[10px] bg-white p-4 border border-red-200 overflow-auto max-h-32">{errorMsg}</pre>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* HEADER */}
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

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',      value: articles.length,                         color: 'bg-black text-white' },
          { label: 'Portada',    value: articles.filter(a => a.featured).length, color: 'bg-red-600 text-white' },
          { label: 'Impacto',    value: articles.filter(a => a.trending).length, color: 'bg-slate-800 text-white' },
          { label: 'Sin imagen', value: articles.filter(a => !a.image).length,   color: 'bg-amber-500 text-white' },
        ].map(s => (
          <div key={s.label} className={`${s.color} p-5 flex flex-col gap-1`}>
            <span className="text-3xl font-black">{s.value}</span>
            <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-70">{s.label}</span>
          </div>
        ))}
      </div>

      {/* GRID */}
      {articles.length === 0 ? (
        <div className="py-32 text-center border border-dashed border-slate-200">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
            No hay artículos publicados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {articles.map(a => (
            <AdminArticleCard key={a.id} article={a} isAdmin={isAdmin} />
          ))}
        </div>
      )}

    </div>
  );
}
