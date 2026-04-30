export const dynamic = 'force-dynamic';

// app/admin/usuarios/page.js — Gestión de Equipo Editorial (Solo Admin)
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import UserForm from './UserForm';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Solo admins pueden ver esta página
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/admin');
  }

  // Usar service role para ver todos los usuarios de Auth
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Obtener perfiles con datos completos
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  // Obtener lista de auth.users para cruzar el email
  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers();

  // Crear mapa de id → email
  const emailMap = {};
  authUsers?.forEach(u => { emailMap[u.id] = u.email; });

  const editors = profiles?.filter(p => p.role === 'editor') || [];
  const admins = profiles?.filter(p => p.role === 'admin') || [];

  return (
    <div className="space-y-12">
      {/* Header */}
      <div>
        <h2 className="text-5xl font-black uppercase tracking-tighter italic">Equipo Editorial</h2>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
          Gestión de Redactores y Accesos — {profiles?.length || 0} miembro(s) total
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* ─── Formulario de Creación ─── */}
        <div className="lg:col-span-4">
          <UserForm />

          {/* Info de permisos */}
          <div className="mt-6 bg-slate-50 p-8 border-l-4 border-slate-300 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Roles y Permisos</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-[8px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-1 shrink-0">Admin</span>
                <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-tight">
                  Acceso total: eliminar artículos, crear usuarios, panel de agentes IA, control del bot.
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[8px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 px-2 py-1 shrink-0">Editor</span>
                <p className="text-[9px] text-slate-500 leading-relaxed font-bold uppercase tracking-tight">
                  Solo puede crear y editar sus propios artículos. No puede eliminar ni ver el panel admin completo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Lista de Usuarios ─── */}
        <div className="lg:col-span-8 space-y-8">
          {/* Admins */}
          <div className="bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-8 py-5 bg-black flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
                Administradores ({admins.length})
              </h3>
              <span className="text-[8px] font-black uppercase tracking-widest text-red-400">Acceso Total</span>
            </div>
            <table className="w-full text-left">
              <tbody className="divide-y divide-gray-50">
                {admins.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-sm font-black uppercase tracking-tight text-black">{p.full_name || 'Sin Nombre'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{emailMap[p.id] || '—'}</p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-[8px] font-black uppercase tracking-widest bg-red-600 text-white px-3 py-1">Admin</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                        {new Date(p.updated_at).toLocaleDateString('es-DO')}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Editores */}
          <div className="bg-white border border-gray-100 overflow-hidden shadow-sm">
            <div className="px-8 py-5 bg-slate-800 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white">
                Editores / Redactores ({editors.length})
              </h3>
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Solo Publicar y Editar</span>
            </div>

            {editors.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
                  Aún no hay editores registrados. Crea el primero con el formulario.
                </p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Nombre / Email</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Rol</th>
                    <th className="px-8 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Creado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {editors.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-black uppercase tracking-tight text-black">{p.full_name || 'Sin nombre'}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{emailMap[p.id] || '—'}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1">Editor</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                          {new Date(p.updated_at).toLocaleDateString('es-DO')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
