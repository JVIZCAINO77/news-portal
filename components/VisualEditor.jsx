'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Blockquote from '@tiptap/extension-blockquote';
import { uploadToCloudinary } from '@/lib/upload';
import { useState, useEffect } from 'react';

/**
 * VisualEditor — Editor WYSIWYG de alto impacto para Imperio Público
 */
export default function VisualEditor({ content, onChange, onPasting }) {
  const [isPasting, setIsPasting] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Blockquote,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image rounded-xl shadow-lg border border-slate-200 transition-all hover:ring-4 hover:ring-red-600/20 cursor-nwse-resize',
        },
      }),
      Placeholder.configure({
        placeholder: 'Comienza a redactar tu primicia aquí...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-red-600 underline font-bold cursor-pointer hover:text-black transition-colors',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Devolvemos el HTML para una representación fiel
      onChange(editor.getHTML());
    },
    editorProps: {
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile();
            if (file) {
              uploadImage(file);
              return true; // Indicamos que hemos manejado el pegado
            }
          }
        }
        return false;
      },
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] font-poppins p-8 text-lg leading-relaxed text-black bg-white border border-gray-100 shadow-sm transition-all focus:border-red-600',
      },
    },
  });

  // Sincronizar contenido si cambia externamente (ej: al cargar en editar)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const uploadImage = async (file) => {
    onPasting(true);
    setIsPasting(true);
    try {
      const url = await uploadToCloudinary(file);
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('Error al subir imagen pegada:', error);
      alert('Error al subir la imagen. Revisa tu conexión.');
    } finally {
      onPasting(false);
      setIsPasting(false);
    }
  };

  const setLink = () => {
    const url = window.prompt('URL del enlace:');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="relative border-4 border-black">
      {/* Barra de Herramientas Premium (Panel de Edición Completo) */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-black text-white border-b-4 border-black sticky top-0 z-20">
        <ToolbarButton 
          active={editor.isActive('bold')} 
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon="B" label="Negrita" 
        />
        <ToolbarButton 
          active={editor.isActive('italic')} 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon="I" label="Cursiva" 
        />
        <ToolbarButton 
          active={editor.isActive('underline')} 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon="U" label="Subrayado" 
          className="underline decoration-2"
        />
        
        <div className="w-[1px] h-6 bg-zinc-800 mx-2" />

        <ToolbarButton 
          active={editor.isActive('heading', { level: 2 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon="H2" label="Título" 
        />
        <ToolbarButton 
          active={editor.isActive('bulletList')} 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon="• Lista" label="Lista" 
        />
        <ToolbarButton 
          active={editor.isActive('blockquote')} 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon="Cita" label="Cita" 
        />

        <div className="w-[1px] h-6 bg-zinc-800 mx-2" />

        <ToolbarButton 
          active={editor.isActive({ textAlign: 'left' })} 
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          icon="←" label="Izquierda" 
        />
        <ToolbarButton 
          active={editor.isActive({ textAlign: 'center' })} 
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          icon="↔" label="Centro" 
        />
        <ToolbarButton 
          active={editor.isActive({ textAlign: 'right' })} 
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          icon="→" label="Derecha" 
        />
        <ToolbarButton 
          active={editor.isActive({ textAlign: 'justify' })} 
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          icon="≡" label="Justificar" 
        />

        <div className="w-[1px] h-6 bg-zinc-800 mx-2" />

        <ToolbarButton 
          active={editor.isActive('link')} 
          onClick={setLink}
          icon="🔗" label="Enlace" 
        />
        
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('Pega la URL de la imagen:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          className="px-4 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          📷 Imagen
        </button>

        <div className="flex-1" />

        <ToolbarButton 
          onClick={() => editor.chain().focus().undo().run()}
          icon="↶" label="Deshacer" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().redo().run()}
          icon="↷" label="Rehacer" 
        />
      </div>

      {/* Área del Editor */}
      <EditorContent editor={editor} />

      {/* Overlay de Carga */}
      {isPasting && (
        <div className="absolute inset-0 bg-white/60 z-30 flex flex-col items-center justify-center backdrop-blur-[2px]">
          <div className="w-12 h-12 border-4 border-black border-t-red-600 rounded-full animate-spin mb-4 shadow-2xl"></div>
          <p className="bg-black text-white px-6 py-3 text-[10px] font-black uppercase tracking-[0.4em]">Subiendo Imagen...</p>
        </div>
      )}

      {/* Guía de ajuste de tamaño */}
      <div className="bg-slate-50 p-4 border-t border-gray-100 flex justify-between items-center">
         <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
            Diseño Editorial Activo — Las imágenes se ajustan automáticamente al ancho del texto.
         </p>
         <p className="text-[9px] font-black uppercase tracking-widest text-black italic">Visual Editor 2.0</p>
      </div>
    </div>
  );
}

function ToolbarButton({ active, onClick, icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
        active ? 'bg-red-600 text-white' : 'hover:bg-zinc-900 text-zinc-400'
      }`}
      title={label}
    >
      {icon}
    </button>
  );
}
