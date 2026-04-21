// app/admin/articulos/editar/[id]/page.js — Editar Noticia (Imperio Público 2.0)
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CATEGORIES } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import MarkdownPreview from '@/components/MarkdownPreview';
import ImageUpload from '@/components/ImageUpload';
import { uploadToCloudinary } from '@/lib/upload';
import VisualEditor from '@/components/VisualEditor';

export default function EditArticlePage() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('noticias');
  const [image, setImage] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [pasting, setPasting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchArticle() {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        alert('Error al cargar el artículo');
        router.push('/admin/articulos');
      } else {
        setTitle(data.title);
        setExcerpt(data.excerpt);
        setContent(data.content);
        setCategory(data.category);
        setImage(data.image);
        setAuthor(data.author);
        setTags(data.tags || '');
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id, supabase, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // 🔍 Validación de Duplicados (excluyendo el artículo actual)
    const { data: existingArticle } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existingArticle) {
      alert("⚠️ ALERTA: Ya existe OTRA noticia con este título. Por favor usa un título diferente.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from('articles')
      .update({
        title,
        slug,
        excerpt,
        content,
        category,
        image,
        author,
        tags,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      alert(`Error: ${error.message}`);
      setSaving(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/articulos');
        router.refresh();
      }, 1000);
    }
  };

  if (loading) return <div className="p-20 text-center font-black uppercase tracking-widest text-slate-300">Cargando Artículo...</div>;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-10 border border-gray-100 border-l-8 border-l-red-600 gap-6">
         <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Editar Publicación</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">ID: {id}</p>
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
        <form onSubmit={handleUpdate} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content Form */}
          <div className="lg:col-span-8 space-y-10">
             <div className="bg-white p-10 space-y-8 border border-gray-100 shadow-sm">
               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Titular de Impacto</label>
                 <input
                   type="text"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   className="w-full text-3xl font-black text-black border-0 border-b-2 border-gray-100 focus:border-red-600 focus:outline-none py-4"
                   required
                 />
               </div>

               <div>
                 <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Bajada / Resumen Ejecutivo</label>
                 <textarea
                   value={excerpt}
                   onChange={(e) => setExcerpt(e.target.value)}
                   className="w-full text-lg font-serif italic text-slate-500 border-0 border-b border-gray-100 focus:border-red-600 focus:outline-none py-4 min-h-[100px]"
                   required
                 />
               </div>

               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Cuerpo de la Noticia (Redacción Visual)</label>
                  <VisualEditor 
                    content={content} 
                    onChange={setContent} 
                    onPasting={setPasting} 
                  />
                  <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                    Modo Editorial Activo — Arrastra imágenes o pégalas directamente. Las fotos se verán al instante.
                  </p>
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

                <ImageUpload 
                  value={image} 
                  onChange={setImage} 
                />

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Firma (Autor)</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-xs outline-none focus:border-red-600"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Hashtags / Etiquetas</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-xs outline-none focus:border-red-600"
                    placeholder="Ej: #ADP, #EDUCACIÓN"
                  />
                </div>

                <div className="bg-slate-50 p-6 border-l-4 border-black">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-black mb-2">Editor de Contenido</h4>
                   <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-tight">
                     Estás actualizando una noticia en vivo. El cambio se reflejará instantáneamente en el portal público tras guardar.
                   </p>
                </div>

                <button
                  type="submit"
                  disabled={saving || success}
                  className={`w-full py-6 text-[10px] font-black uppercase tracking-[0.4em] transition-all ${
                    success ? 'bg-green-600 text-white' : 'bg-black text-white hover:bg-red-600'
                  }`}
                >
                  {saving ? 'Guardando...' : success ? '¡Actualizado!' : 'Guardar Cambios'}
                </button>
             </div>
          </div>
        </form>
      )}
    </div>
  );
}
