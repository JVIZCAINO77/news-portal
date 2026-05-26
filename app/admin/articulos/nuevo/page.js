// app/admin/articulos/nuevo/page.js — Nueva Publicación (Imperio Público 2.0) - Actualizado: 20/04/2026
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORIES } from '@/lib/data';
import MarkdownPreview from '@/components/MarkdownPreview';
import ImageUpload from '@/components/ImageUpload';
import { uploadToCloudinary } from '@/lib/upload';
import VisualEditor from '@/components/VisualEditor';

export default function NewArticlePage() {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('noticias');
  const [image, setImage] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [sourceLink, setSourceLink] = useState('');
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  
  const router = useRouter();

  const handlePublish = async (e) => {
    e.preventDefault();
    setLoading(true);

    const parsedTags = tags.trim()
      ? tags.split(',').map(t => t.trim().replace(/^#/, '').replace(/\s+/g, '')).filter(Boolean)
      : null;

    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          category,
          image,
          author,
          tags: parsedTags,
          sourceLink,
          featured,
          trending,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'duplicate_slug') {
          alert('⚠️ ALERTA EDITORIAL: Ya existe una noticia publicada con este mismo título. Por favor, cámbialo ligeramente para evitar duplicados.');
        } else {
          alert(`Error: ${data.error || 'Error desconocido'}`);
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/articulos');
        router.refresh();
      }, 1500);
    } catch (err) {
      alert(`Error de red: ${err.message}`);
      setLoading(false);
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
                 <label className="block text-[15px] font-bold text-[#2d3748] mb-2">Titular de Impacto</label>
                 <input
                   type="text"
                   value={title}
                   onChange={(e) => setTitle(e.target.value)}
                   className="w-full text-3xl font-bold text-gray-900 border-0 border-b-2 border-gray-200 focus:border-red-600 focus:outline-none py-4 placeholder:text-gray-400 transition-colors"
                   placeholder="Escribe el titular aquí..."
                   required
                 />
               </div>

               <div>
                 <label className="block text-[15px] font-bold text-[#2d3748] mb-2">Bajada / Resumen Ejecutivo</label>
                 <textarea
                   value={excerpt}
                   onChange={(e) => setExcerpt(e.target.value)}
                   className="w-full text-lg font-medium text-gray-700 border-0 border-b border-gray-200 focus:border-red-600 focus:outline-none py-4 min-h-[100px] placeholder:text-gray-400 transition-colors"
                   placeholder="Un breve resumen de la noticia..."
                   required
                 />
               </div>

               <div className="pt-2">
                  <label className="block text-[15px] font-bold text-[#2d3748] mb-3">
                    Contenido <span className="text-red-500">*</span>
                  </label>
                  <VisualEditor 
                    content={content} 
                    onChange={setContent} 
                    onPasting={setPasting} 
                  />
               </div>
             </div>
          </div>

          {/* Sidebar Settings */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-white p-10 border border-gray-100 shadow-sm space-y-8">
                <div>
                  <label className="block text-[14px] font-bold text-[#2d3748] mb-3">Sección Editorial</label>
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
                  <label className="block text-[14px] font-bold text-[#2d3748] mb-3">Firma (Autor)</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-xs outline-none focus:border-red-600"
                    placeholder="Dejar vacío para el nombre del perfil"
                  />
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-[#2d3748] mb-3">Hashtags / Etiquetas</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-xs outline-none focus:border-red-600"
                    placeholder="Ej: #ADP, #EDUCACIÓN (separados por coma)"
                  />
                  <p className="mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                    Ayuda a los lectores a encontrar temas relacionados.
                  </p>
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-[#2d3748] mb-3">URL de la Fuente (Opcional)</label>
                  <input
                    type="url"
                    value={sourceLink}
                    onChange={(e) => setSourceLink(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-gray-100 font-bold text-xs outline-none focus:border-red-600"
                    placeholder="https://ejemplo.com/noticia"
                  />
                  <p className="mt-2 text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                    Enlace al medio original si la noticia es externa.
                  </p>
                </div>

                <div className="flex flex-col gap-4 bg-slate-50 p-6 border-l-4 border-red-600">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={featured} 
                        onChange={(e) => setFeatured(e.target.checked)}
                        className="w-5 h-5 accent-red-600"
                      />
                      <span className="text-[11px] font-black uppercase tracking-widest text-black group-hover:text-red-600 transition-colors">
                        Destacar en Portada (Impacto)
                      </span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={trending} 
                        onChange={(e) => setTrending(e.target.checked)}
                        className="w-5 h-5 accent-red-600"
                      />
                      <span className="text-[11px] font-black uppercase tracking-widest text-black group-hover:text-red-600 transition-colors">
                        Tendencia Crítica (Urgente)
                      </span>
                    </label>
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
