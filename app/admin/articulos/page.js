// app/admin/articulos/page.js — Gestión de Artículos (Imperio Público 2.0)
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import DeleteArticleButton from '@/components/DeleteArticleButton';

export default async function AdminArticlesPage() {
  const supabase = await createClient();
  // ... (rest of the server actions for fetching)
  let articles = [];
  let isAdmin = false;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return <div>Redirigiendo...</div>;

    // Obtener perfil para verificar rol
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    isAdmin = profile?.role === 'admin';

    // Si es admin, ve todos. Si es editor, solo los suyos.
    let query = supabase.from('articles').select('*').order('publishedAt', { ascending: false });
    
    if (!isAdmin) {
      query = query.eq('author_id', user.id);
    }

    const { data, error } = await query;
    if (error) throw error;
    articles = data || [];
  } catch (err) {
    console.error('Error loading articles:', err);
    return (
      <div className="p-12 border-2 border-red-500 bg-red-50 text-red-900">
        <h2 className="text-2xl font-black uppercase mb-4">Error de Base de Datos</h2>
        <p className="text-sm">No pudimos cargar los artículos. Por favor, verifica que las políticas RLS sean correctas.</p>
        <pre className="mt-4 text-[10px] bg-white p-4 border border-red-200 overflow-auto">{err.message}</pre>
      </div>
    );
  }


  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div>
            <h2 className="text-5xl font-black uppercase tracking-tighter italic">Gestión de Contenido</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">
               {isAdmin ? 'Administrando todo el portal' : `Tus artículos publicados (${articles?.length || 0})`}
            </p>
         </div>
         <Link href="/admin/articulos/nuevo" className="bg-red-600 text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-colors">
            + Nuevo Artículo
         </Link>
      </div>

      <div className="bg-white border border-gray-100 overflow-hidden shadow-sm">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-50 border-b border-gray-100">
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Título</th>
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Categoría</th>
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Estado</th>
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Fecha</th>
                     {isAdmin && <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Autor</th>}
                     <th className="px-8 py-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {articles?.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors group">
                       <td className="px-8 py-6">
                          <p className="text-sm font-black uppercase tracking-tight text-black line-clamp-1">{a.title}</p>
                       </td>
                       <td className="px-8 py-6">
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1">{a.category}</span>
                       </td>
                       <td className="px-8 py-6">
                          <div className="flex gap-2">
                            {a.trending && (
                              <span className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-2 py-1 flex items-center gap-1">
                                <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></span>
                                Impacto
                              </span>
                            )}
                            {a.featured && (
                              <span className="text-[8px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-1">
                                Portada
                              </span>
                            )}
                            {!a.trending && !a.featured && (
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-300 border border-slate-100 px-2 py-1">
                                Normal
                              </span>
                            )}
                          </div>
                       </td>
                       <td className="px-8 py-6">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {a.publishedAt 
                              ? new Date(a.publishedAt).toLocaleDateString('es-DO', {day:'2-digit', month:'short'}) 
                              : 'Borrador'}
                          </p>
                       </td>
                       {isAdmin && (
                         <td className="px-8 py-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{a.author}</p>
                         </td>
                       )}
                       <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                             <Link href={`/admin/articulos/editar/${a.id}`} className="p-2 text-slate-400 hover:text-black transition-colors" title="Editar">
                                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M7.127 22.562l-7.127 1.438 1.438-7.128 5.689 5.69zm1.414-1.414l11.228-11.225-5.69-5.692-11.225 11.229 5.687 5.688zm15.459-15.459l-2.828-2.827c-1.171-1.171-3.071-1.171-4.243 0l-1.414 1.415 7.071 7.071 1.414-1.414c1.172-1.171 1.172-3.071 0-4.245z"/></svg>
                             </Link>
                             {isAdmin && (
                               <DeleteArticleButton id={a.id} />
                             )}
                          </div>
                       </td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
         {(!articles || articles.length === 0) && (
            <div className="py-32 text-center">
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">No hay artículos publicados bajo este criterio.</p>
            </div>
         )}
      </div>
    </div>
  );
}
