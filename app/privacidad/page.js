export const metadata = {
  title: 'Política de Privacidad | Imperio Público',
  description: 'Política de privacidad de Imperio Público. Información sobre cookies, publicidad de Google AdSense y derechos del usuario.',
};
export const dynamic = 'force-static';

export default function Privacidad() {
  return (
    <main className="max-w-4xl mx-auto py-12 px-6 lg:px-8 text-slate-800 min-h-screen bg-white">
      <h1 className="text-4xl md:text-6xl font-black mb-4 text-red-600 font-serif uppercase tracking-tighter italic">
        Política de Privacidad
      </h1>
      <p className="text-sm text-slate-400 mb-12 font-mono">Última actualización: 7 de mayo de 2026</p>

      <div className="space-y-10 text-lg leading-relaxed font-serif">

        {/* 1. RESPONSABLE */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">1. Responsable del Tratamiento</h2>
          <p>
            El responsable del tratamiento de los datos personales recabados a través de este sitio web es <strong>Imperio Público</strong>, portal de noticias digital con domicilio en Santo Domingo, República Dominicana.
          </p>
          <p className="mt-3">
            Contacto: <a href="mailto:vizcainosr29@gmail.com" className="text-red-600 font-bold hover:underline">vizcainosr29@gmail.com</a>
          </p>
        </section>

        {/* 2. INFORMACIÓN QUE RECOPILAMOS */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">2. Información que Recopilamos</h2>
          <p>Recopilamos los siguientes tipos de información:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Datos de uso:</strong> dirección IP, tipo de navegador, páginas visitadas, tiempo de permanencia y fuente de referencia.</li>
            <li><strong>Cookies y tecnologías similares:</strong> utilizadas por nosotros y por terceros (ver sección 4).</li>
            <li><strong>Datos de formularios:</strong> nombre y correo electrónico cuando te suscribes a nuestro boletín o nos envías un mensaje a través del formulario de contacto.</li>
          </ul>
          <p className="mt-4">No recopilamos ni almacenamos números de tarjeta de crédito ni información financiera sensible.</p>
        </section>

        {/* 3. FINALIDAD Y BASE LEGAL */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">3. Finalidad y Base Legal del Tratamiento</h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-200 px-4 py-2 text-left font-black uppercase tracking-wide">Finalidad</th>
                  <th className="border border-slate-200 px-4 py-2 text-left font-black uppercase tracking-wide">Base Legal</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-slate-200 px-4 py-2">Operar y mejorar el sitio web</td><td className="border border-slate-200 px-4 py-2">Interés legítimo</td></tr>
                <tr className="bg-slate-50"><td className="border border-slate-200 px-4 py-2">Mostrar publicidad personalizada</td><td className="border border-slate-200 px-4 py-2">Consentimiento del usuario</td></tr>
                <tr><td className="border border-slate-200 px-4 py-2">Análisis de tráfico (Google Analytics)</td><td className="border border-slate-200 px-4 py-2">Interés legítimo / Consentimiento</td></tr>
                <tr className="bg-slate-50"><td className="border border-slate-200 px-4 py-2">Envío de boletín de noticias</td><td className="border border-slate-200 px-4 py-2">Consentimiento expreso</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. COOKIES Y PUBLICIDAD — SECCIÓN CRÍTICA ADSENSE */}
        <section className="bg-slate-50 p-8 border-l-4 border-red-600 shadow-sm">
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight">4. Cookies y Publicidad (Google AdSense)</h2>
          <p className="mb-4">
            Este sitio web utiliza <strong>Google AdSense</strong>, un servicio de publicidad de Google LLC, para mostrar anuncios a los visitantes. Google AdSense emplea cookies para publicar anuncios basados en las visitas anteriores de los usuarios a este sitio u otros sitios de Internet (<em>publicidad basada en intereses</em>).
          </p>
          <p className="mb-4">
            Google, en su condición de proveedor externo, utiliza cookies (incluyendo la cookie <strong>DoubleClick</strong>) para publicar anuncios personalizados basados en las visitas anteriores del usuario a este y otros sitios web.
          </p>
          <p className="mb-4">
            Puedes obtener más información y gestionar tus preferencias de publicidad personalizada de Google en los siguientes enlaces oficiales:
          </p>
          <ul className="space-y-3 mb-4">
            <li>
              <a href="https://www.google.com/policies/privacy/partners/" target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold hover:underline">
                → Cómo utiliza Google la información de servicios externos
              </a>
            </li>
            <li>
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold hover:underline">
                → Configuración de anuncios de Google (opt-out publicidad personalizada)
              </a>
            </li>
            <li>
              <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold hover:underline">
                → Digital Advertising Alliance — Opt-Out general
              </a>
            </li>
            <li>
              <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold hover:underline">
                → Network Advertising Initiative — Opt-Out
              </a>
            </li>
          </ul>
          <p className="text-sm text-slate-600 italic">
            <strong>Nota:</strong> los anuncios mostrados en este sitio pueden ser anuncios de terceros provistos por la red de Google o sus socios publicitarios. Si optas por no recibir publicidad personalizada, seguirás viendo anuncios, pero estos no se basarán en tus intereses.
          </p>
        </section>

        {/* 5. TABLA DE COOKIES */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">5. Tabla de Cookies Utilizadas</h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-200 px-3 py-2 text-left font-black uppercase tracking-wide">Cookie</th>
                  <th className="border border-slate-200 px-3 py-2 text-left font-black uppercase tracking-wide">Proveedor</th>
                  <th className="border border-slate-200 px-3 py-2 text-left font-black uppercase tracking-wide">Finalidad</th>
                  <th className="border border-slate-200 px-3 py-2 text-left font-black uppercase tracking-wide">Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border border-slate-200 px-3 py-2">cookie-consent</td><td className="border border-slate-200 px-3 py-2">Imperio Público</td><td className="border border-slate-200 px-3 py-2">Guarda el consentimiento de cookies</td><td className="border border-slate-200 px-3 py-2">Sesión</td></tr>
                <tr className="bg-slate-50"><td className="border border-slate-200 px-3 py-2">_ga, _gid</td><td className="border border-slate-200 px-3 py-2">Google Analytics</td><td className="border border-slate-200 px-3 py-2">Análisis de tráfico y comportamiento</td><td className="border border-slate-200 px-3 py-2">2 años / 24 h</td></tr>
                <tr><td className="border border-slate-200 px-3 py-2">IDE, DSID</td><td className="border border-slate-200 px-3 py-2">Google DoubleClick</td><td className="border border-slate-200 px-3 py-2">Publicidad personalizada (AdSense)</td><td className="border border-slate-200 px-3 py-2">1 año</td></tr>
                <tr className="bg-slate-50"><td className="border border-slate-200 px-3 py-2">VISITOR_INFO1_LIVE</td><td className="border border-slate-200 px-3 py-2">YouTube</td><td className="border border-slate-200 px-3 py-2">Widgets de vídeo integrados</td><td className="border border-slate-200 px-3 py-2">180 días</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 6. COMPARTICIÓN DE DATOS */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">6. Compartición de Datos con Terceros</h2>
          <p>
            No vendemos ni alquilamos tus datos personales a terceros. Podemos compartir datos con los siguientes proveedores de servicios, únicamente en la medida necesaria para prestar el servicio:
          </p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Google LLC</strong> — Analytics, AdSense, Search Console (EE. UU., bajo el Acuerdo de Marco de Privacidad de Datos UE-EE. UU.)</li>
            <li><strong>Supabase Inc.</strong> — Base de datos y autenticación</li>
            <li><strong>Cloudinary Ltd.</strong> — Almacenamiento y optimización de imágenes</li>
            <li><strong>Vercel Inc.</strong> — Hosting y entrega de contenido</li>
          </ul>
        </section>

        {/* 7. DERECHOS */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">7. Tus Derechos (GDPR / CCPA)</h2>
          <p>Dependiendo de tu ubicación, tienes los siguientes derechos sobre tus datos personales:</p>
          <ul className="list-disc pl-6 mt-4 space-y-2">
            <li><strong>Acceso:</strong> solicitar una copia de los datos que tenemos sobre ti.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión ("derecho al olvido"):</strong> solicitar la eliminación de tus datos.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos para publicidad personalizada.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y legible por máquina.</li>
            <li><strong>Residentes de California (CCPA):</strong> derecho a no venta de información personal y a conocer qué datos se recopilan.</li>
          </ul>
          <p className="mt-4">
            Para ejercer cualquiera de estos derechos, contáctanos en: <a href="mailto:vizcainosr29@gmail.com" className="text-red-600 font-bold hover:underline">vizcainosr29@gmail.com</a>
          </p>
        </section>

        {/* 8. SEGURIDAD */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">8. Seguridad de los Datos</h2>
          <p>
            Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos personales contra el acceso no autorizado, la alteración, divulgación o destrucción. Toda la comunicación entre tu navegador y nuestros servidores se cifra mediante <strong>HTTPS/TLS</strong>.
          </p>
        </section>

        {/* 9. MENORES */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">9. Menores de Edad</h2>
          <p>
            Este sitio web no está dirigido a menores de 13 años. No recopilamos conscientemente información personal de niños menores de 13 años. Si eres padre o tutor y crees que tu hijo nos ha proporcionado información personal, contáctanos de inmediato para que podamos eliminar dicha información.
          </p>
        </section>

        {/* 10. CAMBIOS */}
        <section>
          <h2 className="text-2xl font-black text-black mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">10. Cambios en esta Política</h2>
          <p>
            Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Los cambios serán publicados en esta página con una nueva fecha de "última actualización". Te recomendamos revisar esta página periódicamente.
          </p>
        </section>

        <section className="pt-12 border-t border-gray-100 italic text-sm text-slate-400">
          <p>Última actualización: 7 de mayo de 2026. Al utilizar este sitio web, aceptas los términos de esta Política de Privacidad.</p>
        </section>
      </div>
    </main>
  );
}
