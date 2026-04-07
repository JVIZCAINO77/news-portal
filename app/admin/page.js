// app/admin/page.js — Dashboard Overview (PulsoNoticias 2.0)
import { createClient } from '@/lib/supabase/server';
import { getLatestArticles } from '@/lib/serverData';
import Link from 'next/link';
import AutomationToggle from '@/components/AutomationToggle';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const latest = await getLatestArticles(5);

  // 1. Obtener conteos reales
  const { count: articleCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });
  
  const { count: userCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // 2. Obtener estado del bot
  const { data: botSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'automation_enabled')
    .maybeSingle();

  // 3. Obtener perfil para verificar rol (ya que el dashboard tiene control de bot)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  // Stats reales
  const stats = [
    { label: 'Artículos Totales', value: articleCount || 0 },
    { label: 'Equipo Editorial', value: userCount || 0 },
    { label: 'Lectores Estimados', value: '1.2k' }, // Simulado por ahora
    { label: 'Categorías Activas', value: '8' },
  ];

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
         <div>
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">Hola, {user.email.split('@')[0]}</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">PulsoNoticias Editorial Control Center</p>
         </div>
         <div className="min-w-[300px]">
           <AutomationToggle initialValue={botSetting?.value} isAdmin={isAdmin} />
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
         {stats.map(s => (
           <div key={s.label} className="bg-white p-8 border border-gray-100 border-l-4 border-l-black">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.label}</p>
              <p className="text-4xl font-black text-black leading-none">{s.value}</p>
           </div>
         ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-12">
         <div className="bg-white p-12 border border-gray-100">
            <div className="flex justify-between items-center mb-10 pb-4 border-b-2 border-black">
               <h3 className="text-2xl font-black uppercase tracking-tighter">Últimas Publicaciones</h3>
               <Link href="/admin/articulos" className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline">Ver Todo →</Link>
            </div>

            <div className="space-y-0">
               {latest.map((a, i) => (
                 <div key={a.id} className="flex items-center gap-6 py-6 border-b border-gray-50 group last:border-0 grow">
                    <span className="text-3xl font-black text-slate-100 group-hover:text-red-500 transition-colors leading-none">{i+1}</span>
                    <div className="flex-1">
                       <h4 className="text-lg font-black text-black uppercase tracking-tight group-hover:text-red-600 transition-colors">{a.title}</h4>
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">{a.author} — {new Date(a.publishedAt).toLocaleDateString('es-DO')}</p>
                    </div>
                    <div className="flex gap-4">
                       <Link href={`/admin/articulos/editar/${a.id}`} className="text-[9px] font-black uppercase tracking-widest bg-slate-50 px-4 py-2 hover:bg-black hover:text-white transition-all">Editar</Link>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-12">
         <Link href="/admin/articulos/nuevo" className="bg-red-600 text-white p-12 hover:bg-black transition-all flex flex-col justify-center grow">
            <h4 className="text-3xl font-black uppercase tracking-tighter mb-2">Crear Artículo</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Redactar Nueva Historia</p>
         </Link>
         <Link href="/admin/usuarios" className="bg-white border border-gray-100 p-12 hover:bg-red-500 hover:text-white transition-all group flex flex-col justify-center grow">
            <h4 className="text-3xl font-black uppercase tracking-tighter mb-2">Gestionar Equipo</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-white/60">Asignar Roles y Usuarios</p>
         </Link>
      </div>
    </div>
  );
}
