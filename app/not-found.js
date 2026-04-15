import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 bg-white text-center">
      <div className="max-w-xl mx-auto">
        <h1 className="text-[10rem] font-black leading-none text-gray-100 tracking-tighter mix-blend-multiply">404</h1>
        <div className="-mt-16 bg-white p-6 relative z-10">
          <h2 className="text-3xl font-black text-black uppercase tracking-tight mb-4">Página no Encontrada</h2>
          <p className="text-gray-500 italic mb-10 border-l-4 border-red-600 pl-4 py-2 text-left">
            La noticia, artículo o sección que estás buscando ha sido movida o ya no existe en los archivos de Imperio Público.
          </p>
          <div className="flex justify-center">
             <Link 
               href="/" 
               className="bg-black text-white font-black text-[11px] px-8 py-4 uppercase tracking-[0.2em] hover:bg-red-600 transition-colors"
             >
               Regresar a la Portada
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
