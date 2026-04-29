export const metadata = { title: 'Política de Privacidad | Imperio Público' };

export default function Privacidad() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-zinc-300 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-red-600 font-serif">Política de Privacidad</h1>
      
      <div className="space-y-6 text-lg leading-relaxed">
        <section>
          <p>En <strong>Imperio Público</strong>, accesible desde nuestro portal web, una de nuestras principales prioridades es la privacidad de nuestros visitantes. Este documento detalla los tipos de información que recopilamos y cómo la utilizamos para ofrecerte una mejor experiencia informativa.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4 underline decoration-red-600 decoration-2">1. Recopilación de Información</h2>
          <p>Recopilamos información estándar de registro que tu navegador envía cada vez que visitas nuestro sitio. Esto incluye tu dirección IP, tipo de navegador, páginas visitadas y el tiempo dedicado a las mismas.</p>
        </section>
        
        <section className="bg-zinc-900/50 p-6 border-l-4 border-red-600">
          <h2 className="text-2xl font-semibold text-white mb-4">2. Publicidad y Google AdSense</h2>
          <p className="mb-4">Este sitio web utiliza Google AdSense para mostrar anuncios. Como proveedor externo, Google utiliza cookies para publicar anuncios en nuestro sitio. El uso de la cookie de publicidad de Google permite a Google y a sus socios publicar anuncios basados en las visitas de los usuarios a nuestro sitio o a otros sitios en Internet.</p>
          <p className="mb-4">Puedes obtener más información sobre cómo Google gestiona los datos en sus productos publicitarios visitando el siguiente enlace oficial:</p>
          <a 
            href="https://www.google.com/policies/privacy/partners/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-red-500 font-bold hover:underline block mb-4"
          >
            → Cómo utiliza Google la información de sitios web o aplicaciones que utilizan sus servicios
          </a>
          <p>Los usuarios pueden inhabilitar el uso de la cookie de publicidad personalizada visitando <a href="https://www.google.com/settings/ads" className="text-red-500 hover:underline">Configuración de anuncios</a>.</p>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4 underline decoration-red-600 decoration-2">3. Cookies y Tecnologías de Seguimiento</h2>
          <p>Imperio Público utiliza "cookies" para almacenar las preferencias de los visitantes y optimizar la experiencia de navegación. Utilizamos estas herramientas para entender el comportamiento del usuario en el sitio y mejorar nuestro contenido editorial.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4 underline decoration-red-600 decoration-2">4. Derechos del Usuario (GDPR/CCPA)</h2>
          <p>Dependiendo de tu ubicación, puedes tener derechos sobre tus datos personales, incluyendo el acceso, rectificación o eliminación de los mismos. Para cualquier consulta sobre tus datos, puedes contactarnos a través de nuestra página de <a href="/contacto" className="text-red-500 hover:underline">Contacto</a>.</p>
        </section>

        <section className="pt-8 border-t border-zinc-800 italic text-sm text-zinc-500">
          <p>Última actualización: 29 de abril de 2026. Al utilizar nuestro sitio web, usted acepta nuestra Política de Privacidad y asume sus términos.</p>
        </section>
      </div>
    </div>
  );
}
