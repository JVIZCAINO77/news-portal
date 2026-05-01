import { SITE_CONFIG } from '@/lib/data';

export const metadata = {
  title: `Aviso Legal | ${SITE_CONFIG.name}`,
  description: `Términos legales y condiciones de uso de ${SITE_CONFIG.name}.`,
};

export default function AvisoLegal() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 font-sans text-gray-800 leading-relaxed">
      <header className="mb-12 border-b border-gray-100 pb-10">
        <h1 className="font-serif text-5xl font-black mb-4 leading-tight uppercase tracking-tighter">Aviso Legal</h1>
        <p className="text-gray-500 font-medium tracking-widest uppercase text-xs">Última actualización: 1 de mayo de 2026</p>
      </header>

      <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-red-700">
        <section className="mb-10">
          <h2 className="text-2xl mb-4">1. Identidad del Titular</h2>
          <p>
            En cumplimiento del deber de información general, se hace constar que el dominio <strong>{SITE_CONFIG.url}</strong> es propiedad de <strong>Imperio Público</strong>, con domicilio en Santo Domingo, República Dominicana.
          </p>
          <p>
            Contacto: <a href={`mailto:info@imperiopublico.com`}>info@imperiopublico.com</a>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl mb-4">2. Condiciones de Uso</h2>
          <p>
            El acceso y uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. Las citadas Condiciones serán de aplicación independientemente de las Condiciones Generales de Contratación que en su caso resulten de obligado cumplimiento.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl mb-4">3. Propiedad Intelectual</h2>
          <p>
            Imperio Público por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo, imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, programas de ordenador necesarios para su funcionamiento, acceso y uso, etc.).
          </p>
          <p>
            Quedan expresamente prohibidas la reproducción, la distribución y la comunicación pública, incluida su modalidad de puesta a disposición, de la totalidad o parte de los contenidos de esta página web, con fines comerciales, en cualquier soporte y por cualquier medio técnico, sin la autorización de Imperio Público.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl mb-4">4. Exclusión de Garantías y Responsabilidad</h2>
          <p>
            Imperio Público no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.
          </p>
        </section>
      </div>
    </main>
  );
}
