// app/admin/articulos/nuevo/page.js — Nueva Publicación (Imperio Público 2.0)
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import MarkdownPreview from '@/components/MarkdownPreview';

export default function NewArticlePage() {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('noticias');
  const [image, setImage] = useState('');
  const [author, setAuthor] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const newArticle = {
      title,
      slug,
      excerpt,
      content,
      category,
      image: image || 'https://images.unsplash.com/photo-1504711331083-9c897949ff59?auto=format&fit=crop&w=1200&h=630&q=80',
      author: author || profile?.full_name || user.email.split('@')[0],
      author_id: user.id,
      publishedAt: new Date().toISOString(),
      featured: false
    };

    const { error } = await supabase.from('articles').insert(newArticle);

    if (error) {
      alert(`Error: ${error.message}`);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/articulos');
        router.refresh();
      }, 1500);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 border border-gray-100 border-l-8 border-l-red-600 gap-6">
         <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Redactar Noticia</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Imperio Público Editorial Center</p>
         </div>
         <button 
           type="button"
           onClick={() => setIsPreview(!isPreview)}
           className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${
             isPreview ? 'bg-black text-white border-black' : 'bg-white text-black border-slate-100 hover:border-red-600'
           }`}
         >
           {isPreview ? '← Volver a Editar' : 'Ver Previsualización Real'}
         </button>
      </div>

      {isPreview ? (
        <div className="grid grid-cols-1 gap-12">
           <MarkdownPreview title={title} excerpt={excerpt} content={content} />
        </div>
      ) : (
        <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Form */}
          <div className="lg:col-span-8 space-y-10">
             <div className="bg-white p-10 space-y-8 border border-gray-100 shadow-sm">
               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Titular de Impacto</label>
                 <input
                   type="text"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   className="w-full text-3xl font-black text-black border-0 border-b-2 border-gray-100 focus:border-red-600 focus:outline-none py-4 placeholder:text-slate-100"
                   placeholder="Escribe el titular aquí..."
                   required
                 />
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bajada / Resumen Ejecutivo</label>
                 <textarea
                   value={excerpt}
                   onChange={(e) => setExcerpt(e.target.value)}
                   className="w-full text-lg font-serif italic text-slate-500 border-0 border-b border-gray-100 focus:border-red-600 focus:outline-none py-4 min-h-[100px] placeholder:text-slate-100"
                   placeholder="Un breve resumen de la noticia..."
                   required
                 />
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Cuerpo de la Noticia (Markdown)</label>
                 <textarea
                   value={content}
                   onChange={(e) => setContent(e.target.value)}
                   className="w-full text-base font-serif text-black border border-gray-100 p-8 focus:border-red-600 focus:outline-none min-h-[400px] leading-relaxed"
                   placeholder="Escribe el contenido completo..."
                   required
                 />
               </div>
             </div>
          </div>

          {/* Sidebar Settings */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-white p-10 border border-gray-100 shadow-sm space-y-8">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Sección Editorial</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-black uppercase tracking-widest text-[10px] outline-none focus:border-red-600"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.slug} value={cat.slug}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Imagen Destacada (URL)</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-xs outline-none focus:border-red-600"
                    placeholder="URL de la imagen..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Firma (Autor)</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-xs outline-none focus:border-red-600"
                    placeholder="Dejar vacío para el nombre del perfil"
                  />
                </div>

                <div className="bg-slate-50 p-6 border-l-4 border-red-600">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-2">Espacios Publicitarios</h4>
                   <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                     El sistema asignará automáticamente espacios de Google AdSense. Asegúrate de que el contenido sea apto para anunciantes.
                   </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || success}
                  className={`w-full py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all ${
                    success ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-red-600'
                  }`}
                >
                  {loading ? 'Publicando...' : success ? '¡Publicado!' : 'Lanzar Primicia'}
                </button>
             </div>
          </div>
        </form>
      )}
    </div>
  );
}
