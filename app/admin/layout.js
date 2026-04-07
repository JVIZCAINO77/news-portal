// app/admin/layout.js — Layout para el Panel de Administración (PulsoNoticias 2.0)
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Si no hay usuario, el middleware redireccionará a /admin/login
  if (!user) return <>{children}</>;

  // Obtener perfil del usuario (rol) — No hay cache para cambios en vivo
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();



  const isAdmin = profile?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Section */}
      <aside className="w-full md:w-80 bg-black text-white p-10 flex flex-col justify-between overflow-y-auto">
        <div>
          <Link href="/admin" className="text-3xl font-black uppercase tracking-tighter mb-16 inline-block">
            Pulso<span className="text-red-500">Admin</span>
          </Link>

          <nav className="space-y-4">
             <Link href="/admin" className="block text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-colors py-2 border-b border-white/10">Dashboard</Link>
             <Link href="/admin/articulos" className="block text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-colors py-2 border-b border-white/10">Artículos</Link>
             <Link href="/admin/articulos/nuevo" className="block text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-colors py-2 border-b border-white/10">Nuevo Artículo</Link>
             {isAdmin && (
               <Link href="/admin/usuarios" className="block text-[10px] font-black uppercase tracking-[0.3em] text-red-500 hover:text-white transition-colors py-2 border-b border-white/10">Crear Usuario</Link>
             )}
          </nav>
        </div>

        <div className="pt-20">
           <div className="bg-white/5 p-6 border-l-4 border-red-500">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Usuario</p>
              <p className="text-sm font-black uppercase truncate">{user.email}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500 mt-2">{profile?.role || 'editor'}</p>
           </div>
           
           <form action="/auth/sign-out" method="post">
              <button className="w-full bg-white/10 text-white py-3 text-[9px] font-black uppercase tracking-[0.2em] mt-6 hover:bg-red-500 transition-colors">Cerrar Sesión</button>
           </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:p-16 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
           {children}
        </div>
      </main>
    </div>
  );
}
