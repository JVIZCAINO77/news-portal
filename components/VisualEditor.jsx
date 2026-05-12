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
 * VisualEditor — Editor WYSIWYG rediseñado (Estilo Clean SaaS)
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
          class: 'editor-image rounded-lg shadow-sm border border-gray-200 my-4 max-w-full h-auto',
        },
      }),
      Placeholder.configure({
        placeholder: 'Escribe el contenido de la noticia...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
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
              return true;
            }
          }
        }
        return false;
      },
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[700px] p-6 text-[15px] leading-relaxed text-[#2d3748] bg-white',
      },
    },
  });

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

  const imageCount = (editor.getHTML().match(/<img/g) || []).length;

  return (
    <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Barra de Herramientas Estilo Clean */}
      <div className="flex flex-wrap items-center gap-1 px-4 py-3 bg-[#f8fafc] border-b border-gray-200 sticky top-0 z-20">
        
        <ToolbarButton 
          active={editor.isActive('bold')} 
          onClick={() => editor.chain().focus().toggleBold().run()}
          icon={<span className="font-serif font-bold text-[15px]">B</span>} 
          title="Negrita" 
        />
        <ToolbarButton 
          active={editor.isActive('italic')} 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          icon={<span className="font-serif italic text-[15px]">I</span>} 
          title="Cursiva" 
        />
        <ToolbarButton 
          active={editor.isActive('underline')} 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          icon={<span className="font-serif underline decoration-2 text-[15px]">U</span>} 
          title="Subrayado" 
        />
        
        <div className="w-[1px] h-5 bg-gray-300 mx-2" />

        <ToolbarButton 
          active={editor.isActive('heading', { level: 1 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          icon={<span className="font-bold text-[13px]">H1</span>} 
          title="Título 1" 
        />
        <ToolbarButton 
          active={editor.isActive('heading', { level: 2 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          icon={<span className="font-bold text-[13px]">H2</span>} 
          title="Título 2" 
        />
        <ToolbarButton 
          active={editor.isActive('heading', { level: 3 })} 
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          icon={<span className="font-bold text-[13px]">H3</span>} 
          title="Título 3" 
        />

        <div className="w-[1px] h-5 bg-gray-300 mx-2" />

        <ToolbarButton 
          active={editor.isActive('bulletList')} 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          } 
          title="Lista con viñetas" 
        />
        <ToolbarButton 
          active={editor.isActive('orderedList')} 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>
          } 
          title="Lista numerada" 
        />
        <ToolbarButton 
          active={editor.isActive('blockquote')} 
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
          } 
          title="Cita" 
        />

        <div className="w-[1px] h-5 bg-gray-300 mx-2" />

        <ToolbarButton 
          active={editor.isActive('link')} 
          onClick={setLink}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
          } 
          title="Enlace" 
        />
        
        <ToolbarButton 
          onClick={() => {
            const url = window.prompt('Pega la URL de la imagen:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          } 
          title="Insertar Imagen"
        />

        <div className="w-[1px] h-5 bg-gray-300 mx-2" />

        <ToolbarButton 
          onClick={() => editor.chain().focus().undo().run()}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>
          } 
          title="Deshacer" 
        />
        <ToolbarButton 
          onClick={() => editor.chain().focus().redo().run()}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"></path></svg>
          } 
          title="Rehacer" 
        />

        <div className="ml-auto text-[13px] text-gray-500 font-medium px-2">
          Imágenes: {imageCount}/5
        </div>
      </div>

      {/* Área del Editor */}
      <EditorContent editor={editor} />

      {/* Overlay de Carga */}
      {isPasting && (
        <div className="absolute inset-0 bg-white/60 z-30 flex flex-col items-center justify-center backdrop-blur-[2px]">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mb-3 shadow-sm"></div>
          <p className="text-gray-600 font-medium text-sm">Procesando imagen...</p>
        </div>
      )}
    </div>
  );
}

function ToolbarButton({ active, onClick, icon, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 flex items-center justify-center rounded transition-colors text-gray-600 hover:bg-gray-200 hover:text-gray-900 ${
        active ? 'bg-gray-200 text-gray-900 shadow-inner' : ''
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}
