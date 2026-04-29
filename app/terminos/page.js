export const metadata = { title: 'Términos y Condiciones | Imperio Público' };

export default function Terminos() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-zinc-300 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-red-600 font-serif">Términos y Condiciones</h1>
      
      <div className="space-y-6 text-lg leading-relaxed">
        <section>
          <p>Bienvenido a <strong>Imperio Público</strong>. Al acceder y utilizar este sitio web, usted acepta cumplir y estar sujeto a los siguientes términos y condiciones de uso.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Propiedad Intelectual</h2>
          <p>Todo el contenido publicado en este portal, incluyendo textos, gráficos, logotipos e imágenes, es propiedad de Imperio Público o de sus licenciantes y está protegido por las leyes de propiedad intelectual internacionales.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. Uso del Sitio</h2>
          <p>Usted se compromete a utilizar el sitio únicamente con fines lícitos y de manera que no infrinja los derechos de, restrinja o inhiba el uso y disfrute del sitio por parte de terceros.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Responsabilidad del Contenido</h2>
          <p>Imperio Público se esfuerza por proporcionar información veraz y actualizada. Sin embargo, no garantizamos la exactitud completa ni la disponibilidad ininterrumpida del sitio. El uso de la información proporcionada es bajo su propio riesgo.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Enlaces a Terceros</h2>
          <p>Nuestro portal puede contener enlaces a sitios web externos. No tenemos control ni asumimos responsabilidad por el contenido o las políticas de privacidad de sitios de terceros.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-white mt-8 mb-4">5. Modificaciones</h2>
          <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.</p>
        </section>

        <section className="pt-8 border-t border-zinc-800 italic text-sm text-zinc-500">
          <p>Última revisión: 29 de abril de 2026.</p>
        </section>
      </div>
    </div>
  );
}
