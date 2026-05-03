export const metadata = { title: 'Política de Privacidad | Imperio Público' };

export default function Privacidad() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 lg:px-8 text-slate-800 min-h-screen bg-white">
      <h1 className="text-4xl md:text-6xl font-black mb-12 text-red-600 font-serif uppercase tracking-tighter italic">Política de Privacidad</h1>
      
      <div className="space-y-8 text-lg leading-relaxed font-serif">
        <section>
          <p className="text-xl">En <strong>Imperio Público</strong>, accesible desde nuestro portal web, una de nuestras principales prioridades es la privacidad de nuestros visitantes. Este documento detalla los tipos de información que recopilamos y cómo la utilizamos para ofrecerte una mejor experiencia informativa.</p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mt-10 mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">1. Recopilación de Información</h2>
          <p>Recopilamos información estándar de registro que tu navegador envía cada vez que visitas nuestro sitio. Esto incluye tu dirección IP, tipo de navegador, páginas visitadas y el tiempo dedicado a las mismas.</p>
        </section>
        
        <section className="bg-slate-50 p-8 border-l-4 border-red-600 shadow-sm">
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight">2. Publicidad y Google AdSense</h2>
          <p className="mb-4">Este sitio web utiliza Google AdSense para mostrar anuncios. Como proveedor externo, Google utiliza cookies para publicar anuncios en nuestro sitio. El uso de la cookie de publicidad de Google permite a Google y a sus socios publicar anuncios basados en las visitas de los usuarios a nuestro sitio o a otros sitios en Internet.</p>
          <p className="mb-4">Puedes obtener más información sobre cómo Google gestiona los datos en sus productos publicitarios visitando el siguiente enlace oficial:</p>
          <a 
            href="https://www.google.com/policies/privacy/partners/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-red-600 font-bold hover:underline flex items-center gap-2 mb-4"
          >
            → Cómo utiliza Google la información de servicios externos
          </a>
          <p>Los usuarios pueden inhabilitar el uso de la cookie de publicidad personalizada visitando <a href="https://www.google.com/settings/ads" className="text-red-600 font-bold hover:underline">Configuración de anuncios</a>.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-black text-black mt-10 mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">3. Cookies y Seguimiento</h2>
          <p>Imperio Público utiliza "cookies" para almacenar las preferencias de los visitantes y optimizar la experiencia de navegación. Utilizamos estas herramientas para entender el comportamiento del usuario en el sitio y mejorar nuestro contenido editorial.</p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mt-10 mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">4. Derechos del Usuario (GDPR/CCPA)</h2>
          <p>Dependiendo de tu ubicación, puedes tener derechos sobre tus datos personales, incluyendo el acceso, rectificación o eliminación de los mismos. Para cualquier consulta sobre tus datos, puedes contactarnos a través de nuestra página de <a href="/contacto" className="text-red-600 font-bold hover:underline">Contacto</a>.</p>
        </section>

        <section className="pt-12 border-t border-gray-100 italic text-sm text-slate-400">
          <p>Última actualización: 1 de mayo de 2026. Al utilizar nuestro sitio web, usted acepta nuestra Política de Privacidad y asume sus términos.</p>
        </section>
      </div>
    </div>
  );
}
