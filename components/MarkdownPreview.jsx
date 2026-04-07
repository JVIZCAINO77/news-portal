'use client';
// components/MarkdownPreview.jsx — Previsualización Real (PulsoNoticias 2.0)

export default function MarkdownPreview({ content, title, excerpt }) {
  // Convertir saltos de línea simples en bloques de texto inteligibles
  const lines = content?.split('\n') || [];

  return (
    <div className="bg-white p-10 border border-gray-100 shadow-xl max-h-[80vh] overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-black text-black mb-6 leading-tight tracking-tighter uppercase">
          {title || 'Sin Título'}
        </h1>
        <p className="text-lg text-slate-500 font-serif leading-relaxed mb-8 italic border-l-4 border-gray-100 pl-4">
          {excerpt || 'Sin resumen ejecutivo...'}
        </p>
        <div className="prose-news">
          {lines.map((line, i) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return <div key={i} className="h-4" />;

            // Títulos: ## Título -> <h2>
            if (trimmedLine.startsWith('## ')) {
              return (
                <h2 key={i} className="text-2xl font-black text-black mt-8 mb-4 uppercase tracking-tighter italic">
                  {trimmedLine.replace('## ', '')}
                </h2>
              );
            }

            // Títulos: # Título -> <h1> (opcional)
            if (trimmedLine.startsWith('# ')) {
              return (
                <h3 key={i} className="text-xl font-black text-black mt-6 mb-3 uppercase">
                  {trimmedLine.replace('# ', '')}
                </h3>
              );
            }

            // Negritas: **texto** -> <strong>
            const formattedText = trimmedLine.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black">$1</strong>');
            
            return (
              <p 
                key={i} 
                className="mb-4 text-base font-serif leading-relaxed text-[#333]" 
                dangerouslySetInnerHTML={{ __html: formattedText }} 
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
