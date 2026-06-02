import { SITE_CONFIG } from '@/lib/data';

export const dynamic = 'force-static';

export const metadata = {
  title: `Aviso Legal | ${SITE_CONFIG.name}`,
  description: `T�rminos legales y condiciones de uso de ${SITE_CONFIG.name}.`,
};

export default function AvisoLegal() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 font-sans text-gray-800 leading-relaxed">
      <header className="mb-12 border-b border-gray-100 pb-10">
        <h1 className="font-serif text-5xl font-black mb-4 leading-tight uppercase tracking-tighter">Aviso Legal</h1>
        <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">�ltima actualizaci�n: 1 de mayo de 2026</p>
      </header>

      <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-red-700">
        <section className="mb-10">
          <h2 className="text-2xl mb-4">1. Identidad del Titular</h2>
          <p>
            En cumplimiento del deber de informaci�n general, se hace constar que el dominio <strong>{SITE_CONFIG.url}</strong> es propiedad de <strong>Imperio P�blico</strong>, con domicilio en Santo Domingo, Rep�blica Dominicana.
          </p>
          <p>
            Contacto: <a href="mailto:jvizcaino242@gmail.com">jvizcaino242@gmail.com</a>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl mb-4">2. Condiciones de Uso</h2>
          <p>
            El acceso y uso de este portal atribuye la condici�n de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aqu� reflejadas. Las citadas Condiciones ser�n de aplicaci�n independientemente de las Condiciones Generales de Contrataci�n que en su caso resulten de obligado cumplimiento.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl mb-4">3. Propiedad Intelectual</h2>
          <p>
            Imperio P�blico por s� o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su p�gina web, as� como de los elementos contenidos en la misma (a t�tulo enunciativo, im�genes, sonido, audio, v�deo, software o textos; marcas o logotipos, combinaciones de colores, estructura y dise�o, selecci�n de materiales usados, programas de ordenador necesarios para su funcionamiento, acceso y uso, etc.).
          </p>
          <p>
            Quedan expresamente prohibidas la reproducci�n, la distribuci�n y la comunicaci�n p�blica, incluida su modalidad de puesta a disposici�n, de la totalidad o parte de los contenidos de esta p�gina web, con fines comerciales, en cualquier soporte y por cualquier medio t�cnico, sin la autorizaci�n de Imperio P�blico.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl mb-4">4. Exclusi�n de Garant�as y Responsabilidad</h2>
          <p>
            Imperio P�blico no se hace responsable, en ning�n caso, de los da�os y perjuicios de cualquier naturaleza que pudieran ocasionar, a t�tulo enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisi�n de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnol�gicas necesarias para evitarlo.
          </p>
        </section>
      </div>
    </main>
  );
}
