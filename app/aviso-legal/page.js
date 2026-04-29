export const metadata = { title: 'Aviso Legal | Imperio Público' };

export default function AvisoLegal() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-zinc-300 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-red-600 font-serif">Aviso Legal</h1>
      
      <div className="space-y-6 text-lg leading-relaxed">
        <p>El presente aviso legal recoge las condiciones generales que rigen el acceso y el uso del sitio web Imperio Público, cuyo objetivo primordial es ofrecer información objetiva, veraz e inmediata a nuestros lectores en República Dominicana y Latinoamérica.</p>
        
        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Derechos de Propiedad Intelectual</h2>
        <p>Todos los contenidos del sitio web, entendiendo por estos a título meramente enunciativo los textos, fotografías, gráficos, imágenes, así como su diseño gráfico y códigos fuente, se rigen por principios de periodismo ético. Imperio Público realiza un filtrado y curaduría automatizada de información en tiempo real, respetando exhaustivamente las fuentes originales y proporcionando el enlace explícito ("Fuente original") a los editores primarios en caso de utilizar fragmentos de contenido o metadatos.</p>
        
        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Exención de Responsabilidad</h2>
        <p>Imperio Público no asume ningún tipo de responsabilidad extraída de la información proporcionada al exterior o a través de los enlaces (links) existentes en otras páginas corporativas. Imperio Público emplea tecnología avanzada de curaduría y procesamiento de datos para ofrecer información en tiempo real. Todos nuestros contenidos pasan por un proceso de supervisión editorial para garantizar la coherencia informativa, aunque el volumen masivo de noticias procesadas puede dar lugar a discrepancias que son revisadas y corregidas periódicamente por nuestro equipo humano.</p>

        
        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Monetización y Privacidad</h2>
        <p>Este sitio web está sostenido mediante programas de afiliados y sistemas de red de anuncios, específicamente Google AdSense, por lo que ciertos enlaces y vistas están diseñados para sostener este medio de comunicación de calidad, libre y público. Por favor, revise nuestra Política de Privacidad para más detalles sobre cómo funciona esto con las cookies.</p>
      </div>
    </div>
  );
}
