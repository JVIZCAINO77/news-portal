// app/admin/layout.js — Layout del Panel de Administración (Imperio Público 2.0)
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import BotControls from '@/components/BotControls';


export default async function AdminLayout({ children }) {
  let user = null;
  let profile = null;
  let isAdmin = false;
  let botEnabled = false;

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError || !authData?.user) {
      // No autenticado — solo muestra el children (ej. página de login)
      return <>{children}</>;
    }

    user = authData.user;

    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    profile = profileData;
    isAdmin = profile?.role === 'admin';

    // La tabla settings puede no existir aún — no debe romper el layout
    try {
      const { data: botSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'automation_enabled')
        .maybeSingle();
      botEnabled = botSetting?.value === true;
    } catch (_settingsErr) {
      // Ignorar si la tabla settings no existe
      botEnabled = false;
    }
  } catch (layoutError) {
    console.error('[AdminLayout] Error cargando datos:', layoutError);
    // Si hay un error grave de auth, mostrar solo el children
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* ── Sidebar ── */}
      <aside className="w-full md:w-64 bg-black text-white flex flex-col justify-between shrink-0">
        <div className="p-8">
          {/* Logo */}
          <Link href="/admin" className="block mb-10">
            <span className="text-xl font-black uppercase tracking-tighter">
              Imperio<span className="text-red-500">Admin</span>
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
            <Link href="/admin/perfil" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] hover:text-red-500 transition-colors py-3 border-b border-white/10">
              👤 Mi Perfil
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
          <div className="flex items-center gap-3 mb-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-black text-lg">
                {(profile?.full_name || user?.email || '?')[0].toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Usuario Activo</p>
              <p className="text-[10px] font-black uppercase truncate text-white/80">{profile?.full_name || user?.email}</p>
            </div>
          </div>
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
