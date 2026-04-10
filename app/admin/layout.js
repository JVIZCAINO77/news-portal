// app/admin/layout.js — Layout del Panel de Administración (PulsoNoticias 2.0)
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // El middleware ya redirige a /admin/login si no hay sesión
  if (!user) return <>{children}</>;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-72 bg-black text-white flex flex-col justify-between overflow-y-auto shrink-0">
        <div className="p-8">
          <Link href="/admin" className="text-2xl font-black uppercase tracking-tighter mb-12 inline-block">
            Pulso<span className="text-red-500">Admin</span>
          </Link>

          <nav className="space-y-1 mt-8">
            {/* Dashboard — solo admin */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] hover:text-red-500 transition-colors py-3 border-b border-white/5"
              >
                <span className="opacity-40">◈</span> Dashboard
              </Link>
            )}

            {/* Artículos — todos */}
            <Link
              href="/admin/articulos"
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] hover:text-red-500 transition-colors py-3 border-b border-white/5"
            >
              <span className="opacity-40">◉</span> Artículos
            </Link>

            {/* Nuevo Artículo — todos */}
            <Link
              href="/admin/articulos/nuevo"
              className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-red-500 hover:text-white transition-colors py-3 border-b border-white/5"
            >
              <span>＋</span> Nuevo Artículo
            </Link>

            {/* Gestión de Usuarios — SOLO ADMIN */}
            {isAdmin && (
              <Link
                href="/admin/usuarios"
                className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] hover:text-red-500 transition-colors py-3 border-b border-white/5"
              >
                <span className="opacity-40">◎</span> Crear Editor
              </Link>
            )}
          </nav>

          {/* Rol Badge */}
          <div className={`mt-8 inline-flex items-center gap-2 px-3 py-2 text-[8px] font-black uppercase tracking-widest ${
            isAdmin ? 'bg-red-600 text-white' : 'bg-white/10 text-white/60'
          }`}>
            {isAdmin ? '★ Administrador' : '● Editor'}
          </div>
        </div>

        {/* Footer del sidebar */}
        <div className="p-8 border-t border-white/10">
          <div className="mb-4">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-1">Sesión activa</p>
            <p className="text-xs font-black uppercase truncate text-white/80">{user.email}</p>
          </div>
          <form action="/auth/sign-out" method="post">
            <button className="w-full bg-white/5 border border-white/10 text-white py-3 text-[9px] font-black uppercase tracking-[0.25em] hover:bg-red-600 hover:border-red-600 transition-all">
              Cerrar Sesión
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 p-8 md:p-14 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
