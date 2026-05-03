// app/admin/page.js — Dashboard Overview (Imperio Público 2.0)
export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { getLatestArticles } from '@/lib/serverData';
import { SITE_CONFIG } from '@/lib/data';
import Link from 'next/link';
import AutomationToggle from '@/components/AutomationToggle';
import AgentsDashboard from '@/components/AgentsDashboard';
import TrafficDashboard from '@/components/TrafficDashboard';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const latest = await getLatestArticles(5);

  // Usar service role para ver los perfiles para no caer en RLS recursion
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Conteos eficientes — sin traer filas de datos a memoria
  const { count: articleCount } = await supabase
    .from('articles')
    .select('*', { count: 'exact', head: true });

  // Suma de vistas por categoría — solo los campos estrictamente necesarios
  const { data: viewsData } = await supabase
    .from('articles')
    .select('views, category')
    .not('views', 'is', null);

  const totalViews = viewsData?.reduce((acc, curr) => acc + (curr.views || 0), 0) || 0;
  const activeCategories = new Set(viewsData?.map(a => a.category).filter(Boolean)).size;

  const { count: userCount } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // 2. Estado del bot
  const { data: botSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'automation_enabled')
    .maybeSingle();

  // 3. Perfil para verificar rol
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const gaId = SITE_CONFIG.gaId;

  const stats = [
    { label: 'Artículos Totales', value: articleCount || 0 },
    { label: 'Equipo Editorial', value: userCount || 0 },
    { label: 'Vistas Totales', value: totalViews.toLocaleString('es-DO') },
    { label: 'Categorías Activas', value: activeCategories },
  ];

  // Distribución de vistas por categoría — Top 3
  const catStats = {};
  viewsData?.forEach(a => {
    if (a.category) catStats[a.category] = (catStats[a.category] || 0) + (a.views || 0);
  });
  const topCategories = Object.entries(catStats)
    .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black uppercase tracking-tighter mb-2 italic">
            Hola, {user.email.split('@')[0]}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
            Imperio Público Editorial Control Center
            {' · '}
            <span className={isAdmin ? 'text-red-500' : 'text-slate-400'}>
              {isAdmin ? 'Administrador' : 'Editor'}
            </span>
          </p>
        </div>
        {isAdmin && (
          <div className="min-w-[300px]">
            <AutomationToggle initialValue={botSetting?.value} isAdmin={isAdmin} />
          </div>
        )}
      </div>

      {/* TRÁFICO — SOLO ADMIN */}
      {isAdmin && (
        <TrafficDashboard 
          gaId={gaId} 
          siteUrl={SITE_CONFIG.url}
          realStats={{ totalViews, topCategories }} 
        />
      )}

      {/* Stats Grid — solo admin ve todos los stats */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white p-8 border border-gray-100 border-l-4 border-l-black">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{s.label}</p>
              <p className="text-4xl font-black text-black leading-none">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Panel de Agentes — solo admin */}
      {isAdmin && <AgentsDashboard botEnabled={botSetting?.value === true} />}

      {/* Quick Actions */}
      <div className={`grid grid-cols-1 gap-8 ${isAdmin ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
        {/* Crear Artículo — visible para todos */}
        <Link
          href="/admin/articulos/nuevo"
          className="bg-red-600 text-white p-12 hover:bg-black transition-all flex flex-col justify-center group"
        >
          <h4 className="text-3xl font-black uppercase tracking-tighter mb-2">Crear Artículo</h4>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Redactar Nueva Historia</p>
        </Link>

        {/* Gestionar Artículos */}
        <Link
          href="/admin/articulos"
          className="bg-white border border-gray-100 p-12 hover:bg-slate-900 hover:text-white transition-all group flex flex-col justify-center"
        >
          <h4 className="text-3xl font-black uppercase tracking-tighter mb-2">Mis Artículos</h4>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-white/60">
            {isAdmin ? 'Gestionar Todo el Portal' : 'Ver y Editar mis publicaciones'}
          </p>
        </Link>

        {/* Crear Nuevo Usuario — SOLO ADMIN */}
        {isAdmin && (
          <Link
            href="/admin/usuarios"
            className="bg-black text-white p-12 hover:bg-red-600 transition-all flex flex-col justify-center group relative overflow-hidden"
          >
            {/* Badge decorativo */}
            <span className="absolute top-4 right-4 text-[8px] font-black uppercase tracking-widest bg-red-600 group-hover:bg-black text-white px-2 py-1 transition-colors">
              Solo Admin
            </span>
            <h4 className="text-3xl font-black uppercase tracking-tighter mb-2">Crear Editor</h4>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
              Registrar Nuevos Redactores
            </p>
          </Link>
        )}
      </div>

      {/* Recent Activity — todos lo ven (editores solo sus artículos) */}
      <div className="bg-white p-12 border border-gray-100">
        <div className="flex justify-between items-center mb-10 pb-4 border-b-2 border-black">
          <h3 className="text-2xl font-black uppercase tracking-tighter">Últimas Publicaciones</h3>
          <Link href="/admin/articulos" className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:underline">
            Ver Todo →
          </Link>
        </div>

        <div className="space-y-0">
          {latest.length === 0 && (
            <p className="py-16 text-center text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">
              No hay artículos aún. {isAdmin ? 'Activa los agentes o crea el primero. →' : 'Crea tu primer artículo. →'}
            </p>
          )}
          {latest.map((a, i) => (
            <div key={a.id} className="flex items-center gap-6 py-6 border-b border-gray-50 group last:border-0">
              <span className="text-3xl font-black text-slate-100 group-hover:text-red-500 transition-colors leading-none">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-black text-black uppercase tracking-tight group-hover:text-red-600 transition-colors truncate">{a.title}</h4>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">
                  {a.author} — {new Date(a.publishedAt).toLocaleDateString('es-DO')}
                </p>
              </div>
              <Link
                href={`/admin/articulos/editar/${a.id}`}
                className="text-[9px] font-black uppercase tracking-widest bg-slate-50 px-4 py-2 hover:bg-black hover:text-white transition-all shrink-0"
              >
                Editar
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
