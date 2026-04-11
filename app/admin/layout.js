// app/admin/layout.js — Layout del Panel de Administración (Imperio Público 2.0)
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import BotControls from '@/components/BotControls';

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <>{children}</>;

  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const { data: botSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'automation_enabled')
    .maybeSingle();

  const isAdmin = profile?.role === 'admin';
  const botEnabled = botSetting?.value === true;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-black text-white flex flex-col justify-between shrink-0">
        <div className="p-8">
          {/* Logo */}
          <Link href="/admin" className="block mb-10">
            <span className="text-xl font-black uppercase tracking-tighter">
              Pulso<span className="text-red-500">Admin</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="space-y-0">
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] hover:text-red-500 transition-colors py-3 border-b border-white/10">
                Dashboard
              </Link>
            )}
            <Link href="/admin/articulos" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] hover:text-red-500 transition-colors py-3 border-b border-white/10">
              • Artículos
            </Link>
            <Link href="/admin/articulos/nuevo" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-red-500 hover:text-white transition-colors py-3 border-b border-white/10">
              + Nuevo Artículo
            </Link>
            {isAdmin && (
              <Link href="/admin/usuarios" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] hover:text-red-500 transition-colors py-3 border-b border-white/10">
                ◎ Crear Usuario
              </Link>
            )}
          </nav>

          {/* Bot Controls — Solo Admin */}
          {isAdmin && (
            <div className="mt-8">
              <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-3">Agentes IA</p>
              <BotControls initialEnabled={botEnabled} />
            </div>
          )}

          {/* Rol Badge */}
          <div className={`mt-8 inline-flex items-center px-3 py-1.5 text-[8px] font-black uppercase tracking-widest ${
            isAdmin ? 'bg-red-600 text-white' : 'bg-white/10 text-white/60'
          }`}>
            {isAdmin ? '★ Administrador' : '● Editor'}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/10">
          <p className="text-[8px] font-black uppercase tracking-widest text-white/30 mb-1">Usuario Activo</p>
          <p className="text-[10px] font-black uppercase truncate text-white/80 mb-4">{user?.email}</p>
          <form action="/auth/sign-out" method="post">
            <button className="w-full bg-white/5 border border-white/10 text-white py-3 text-[8px] font-black uppercase tracking-[0.25em] hover:bg-red-600 hover:border-red-600 transition-all">
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
