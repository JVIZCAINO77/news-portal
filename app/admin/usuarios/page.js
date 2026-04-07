// app/admin/usuarios/page.js — Gestión de Equipo (Solo Admin)
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UserForm from './UserForm';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verificar si el usuario es Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/admin');
  }

  // Obtener todos los perfiles
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true });

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">Gestión de Equipo</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Personal Administrativo y Editorial</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* User Creation Form */}
        <div className="lg:col-span-4">
           <UserForm />
        </div>

        {/* User List */}
        <div className="lg:col-span-8 bg-white border border-gray-100 shadow-sm overflow-hidden">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-slate-50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Nombre</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Rol</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Último Acceso</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {profiles?.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                         <p className="text-sm font-black uppercase tracking-tight text-black">{p.full_name || 'Sin Nombre'}</p>
                         <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-1">ID: {p.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-8 py-6">
                         <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 ${
                           p.role === 'admin' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'
                         }`}>
                           {p.role}
                         </span>
                      </td>
                      <td className="px-8 py-6">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {new Date(p.updated_at).toLocaleDateString('es-DO')}
                         </p>
                      </td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
