export const metadata = { title: 'Términos y Condiciones | Imperio Público', description: 'Términos y condiciones de uso del portal Imperio Público.' };
export const dynamic = 'force-static';

export default function Terminos() {
  return (
    <main className="max-w-4xl mx-auto py-12 px-6 lg:px-8 text-slate-800 min-h-screen bg-white">
      <h1 className="text-4xl md:text-6xl font-black mb-12 text-red-600 font-serif uppercase tracking-tighter italic">Términos y Condiciones</h1>
      
      <div className="space-y-8 text-lg leading-relaxed font-serif">
        <section>
          <p className="text-xl">Bienvenido a <strong>Imperio Público</strong>. Al acceder y utilizar este sitio web, usted acepta cumplir y estar sujeto a los siguientes términos y condiciones de uso.</p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mt-10 mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">1. Propiedad Intelectual</h2>
          <p>Todo el contenido publicado en este portal, incluyendo textos, gráficos, logotipos e imágenes, es propiedad de Imperio Público o de sus licenciantes y está protegido por las leyes de propiedad intelectual internacionales.</p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mt-10 mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">2. Uso del Sitio</h2>
          <p>Usted se compromete a utilizar el sitio únicamente con fines lícitos y de manera que no infrinja los derechos de, restrinja o inhiba el uso y disfrute del sitio por parte de terceros.</p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mt-10 mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">3. Responsabilidad del Contenido</h2>
          <p>Imperio Público se esfuerza por proporcionar información veraz y actualizada. Sin embargo, no garantizamos la exactitud completa ni la disponibilidad ininterrumpida del sitio. El uso de la información proporcionada es bajo su propio riesgo.</p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mt-10 mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">4. Enlaces a Terceros</h2>
          <p>Nuestro portal puede contener enlaces a sitios web externos. No tenemos control ni asumimos responsabilidad por el contenido o las políticas de privacidad de sitios de terceros.</p>
        </section>

        <section>
          <h2 className="text-2xl font-black text-black mt-10 mb-4 uppercase tracking-tight border-b-2 border-red-600 inline-block">5. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.</p>
        </section>

        <section className="pt-12 border-t border-gray-100 italic text-sm text-slate-400">
          <p>Última revisión: 1 de mayo de 2026.</p>
        </section>
      </div>
    </main>
  );
}
