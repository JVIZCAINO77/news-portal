// app/nosotros/page.js — Sobre Nosotros (Imperio Público) — Versión editorial completa
import Link from 'next/link';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Sobre Nosotros | Imperio Público — Periodismo Dominicano',
  description: 'Imperio Público es un medio digital independiente dominicano fundado para hacer periodismo veraz y responsable. Conoce nuestra historia, equipo editorial y principios éticos.',
  alternates: { canonical: 'https://imperiopublico.com/nosotros' },
};

const TEAM = [
  { name: 'José Vizcaíno', role: 'Director y Fundador', email: 'jvizcaino242@gmail.com', bio: 'Periodista digital y emprendedor de medios con más de 8 años de experiencia en comunicación, cobertura política y producción de contenido para audiencias dominicanas dentro y fuera del país. Fundó Imperio Público con la convicción de que la República Dominicana merece un medio digital ágil, veraz e independiente que priorice al ciudadano.' },
  { name: 'Mesa Política', role: 'Editores de Política Nacional', email: 'redaccion@imperiopublico.com', bio: 'Equipo especializado en cobertura del poder ejecutivo, legislativo y judicial dominicano. Con fuentes en el Congreso Nacional y la Presidencia, ofrecen análisis profundo de cada decisión que impacta la vida de los ciudadanos.' },
  { name: 'Mesa Deportiva', role: 'Editores de Deportes', email: 'deportes@imperiopublico.com', bio: 'Periodistas con seguimiento cercano al béisbol dominicano en las Grandes Ligas, la Liga Dominicana de Béisbol y los seleccionados nacionales, con análisis que va más allá del marcador.' },
  { name: 'Redacción Económica', role: 'Economía y Finanzas', email: 'economia@imperiopublico.com', bio: 'Analistas que traducen los datos macroeconómicos a un lenguaje accesible. Cubren el dólar, la inflación, el sector empresarial y las políticas del Banco Central con rigor y contexto ciudadano.' },
  { name: 'Sección Internacional', role: 'Noticias Mundiales', email: 'internacional@imperiopublico.com', bio: 'Periodistas con visión global que seleccionan y contextualizan los eventos internacionales de mayor impacto para la audiencia dominicana, desde la geopolítica al cambio climático.' },
  { name: 'Redacción Digital', role: 'Tecnología y Redes', email: 'digital@imperiopublico.com', bio: 'Especialistas en distribución de contenido digital, SEO periodístico y redes sociales. Garantizan que cada noticia llegue al mayor número de dominicanos posible en el momento oportuno.' },
];

const PRINCIPLES = [
  { title: 'Veracidad ante todo', desc: 'Publicamos solo información verificada. Ante la duda, preferimos esperar a la confirmación antes que publicar una primicia equivocada. La credibilidad de Imperio Público vale más que cualquier clic.' },
  { title: 'Independencia editorial', desc: 'Imperio Público no pertenece a ningún partido político, grupo empresarial ni entidad gubernamental. Nuestras decisiones editoriales las toma exclusivamente la redacción.' },
  { title: 'Corrección transparente', desc: 'Cuando cometemos un error, lo corregimos de forma explícita y visible. No borramos artículos: los corregimos con una nota que explica qué cambió y por qué.' },
  { title: 'Protección de fuentes', desc: 'Protegemos a nuestras fuentes confidenciales. Cuando alguien nos confía información bajo reserva de identidad, esa confianza es sagrada y nunca será traicionada.' },
  { title: 'Contexto y pluralidad', desc: 'Buscamos activamente las versiones de todos los involucrados. El periodismo no es un monólogo: es la suma de perspectivas que permite al lector formarse su propia opinión.' },
  { title: 'Interés público', desc: 'Nuestra selección se guía por una pregunta: ¿le importa esto al ciudadano dominicano? Si la respuesta es sí, lo cubrimos con el rigor que el tema merece.' },
];

export default function NosotrosPage() {
  return (
    <main className="bg-white">

      <header className="bg-gray-50 border-b border-gray-100 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 mb-4 block">Nuestra Identidad</span>
          <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter leading-none italic mb-6">
            Sobre <span className="text-red-600">Nosotros</span>
          </h1>
          <p className="text-xl font-serif text-slate-600 max-w-3xl leading-relaxed">
            Imperio Público es un medio digital independiente dominicano. Hacemos periodismo veraz,
            oportuno y comprometido con la realidad de nuestra gente desde 2024.
          </p>
        </div>
      </header>

      {/* Historia */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">Nuestra Historia</span>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-8">Un Medio Nacido del Compromiso</h2>
              <div className="space-y-5 font-serif text-lg text-slate-700 leading-relaxed">
                <p>Imperio Público nació en 2024 de la convicción de que la República Dominicana necesitaba un medio digital que priorizara la información de interés ciudadano sobre los titulares sensacionalistas y los intereses políticos.</p>
                <p>Desde nuestros primeros artículos, establecimos un estándar: cada noticia debe estar verificada, contextualizada y presentada de forma que el lector no solo sepa qué pasó, sino por qué importa.</p>
                <p>Hoy, Imperio Público cubre 12 secciones temáticas con un equipo editorial dedicado a mantener los más altos estándares del periodismo digital latinoamericano. Más de 1,000 artículos publicados avalan nuestro compromiso con la información de calidad.</p>
              </div>
            </div>
            <div className="lg:col-span-5">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 block">Hitos</span>
              <div className="space-y-6 border-l-2 border-gray-100 pl-6">
                {[
                  { year: '2024', event: 'Fundación de Imperio Público como portal digital dominicano independiente.' },
                  { year: '2025', event: 'Lanzamiento de cobertura en tiempo real y expansión a 12 secciones temáticas.' },
                  { year: '2025', event: 'Integración con Google Discover y publicación activa en 4 redes sociales.' },
                  { year: '2026', event: 'Superamos 1,000 artículos publicados y consolidamos presencia en Google News.' },
                ].map((m, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[1.85rem] top-1 w-3 h-3 bg-red-600 rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-red-600 block mb-1">{m.year}</span>
                    <p className="text-sm font-serif text-slate-600 leading-relaxed">{m.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Misión / Visión / Valores */}
      <section className="py-20 border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="border-l-4 border-red-600 pl-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4">Misión</h2>
              <p className="text-lg font-serif text-slate-800 leading-relaxed">Proveer información veraz, oportuna y accesible a todos los dominicanos, fiscalizando el poder y contribuyendo al debate democrático informado.</p>
            </div>
            <div className="border-l-4 border-black pl-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-black mb-4">Visión</h2>
              <p className="text-lg font-serif text-slate-800 leading-relaxed">Ser el portal de noticias de referencia de la República Dominicana y la diáspora dominicana, reconocido por su excelencia editorial e independencia.</p>
            </div>
            <div className="border-l-4 border-slate-300 pl-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800 mb-4">Valores</h2>
              <ul className="space-y-2">
                {['Veracidad', 'Objetividad', 'Independencia editorial', 'Responsabilidad social', 'Transparencia', 'Pluralismo'].map(v => (
                  <li key={v} className="text-base font-serif text-slate-800 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full flex-shrink-0" />{v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Principios */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">Ética Periodística</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Principios Editoriales</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRINCIPLES.map((p) => (
              <div key={p.title} className="border border-gray-100 p-8 hover:border-red-600 transition-colors group">
                <h3 className="text-base font-black uppercase tracking-tight text-black mb-4 group-hover:text-red-600 transition-colors">{p.title}</h3>
                <p className="text-sm font-serif text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Equipo */}
      <section className="py-20 border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-14">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">Las Personas Detrás</span>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Equipo Editorial</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEAM.map((member) => (
              <div key={member.name} className="bg-white border border-gray-100 p-8 hover:border-red-600 transition-colors group">
                <div className="w-12 h-12 bg-black group-hover:bg-red-600 transition-colors flex items-center justify-center mb-5">
                  <span className="text-lg font-black text-white">{member.name.charAt(0)}</span>
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-black mb-1">{member.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-4">{member.role}</p>
                <p className="text-sm font-serif text-slate-600 leading-relaxed mb-4">{member.bio}</p>
                <a href={`mailto:${member.email}`} className="text-[10px] font-bold text-slate-400 hover:text-red-600 transition-colors">{member.email}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Correcciones */}
      <section className="py-20 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">Transparencia</span>
          <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-8">Política de Correcciones</h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed">
            <p>En Imperio Público reconocemos que el periodismo es un ejercicio humano y susceptible de errores. Cuando detectamos un error factual, procedemos de la siguiente manera:</p>
            <ol className="list-decimal pl-6 space-y-3 text-base">
              <li>Añadimos una nota de corrección visible al artículo original, indicando exactamente qué información fue corregida y cuándo.</li>
              <li>No eliminamos el contenido original: lo mantenemos con la corrección visible para preservar la trazabilidad editorial.</li>
              <li>En errores graves, publicamos una nota editorial separada explicando el error y las medidas adoptadas.</li>
            </ol>
            <p>Para reportar un error: <a href="mailto:vizcainosr29@gmail.com" className="text-red-600 font-bold hover:underline">vizcainosr29@gmail.com</a> con el asunto &quot;Corrección&quot;.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">¿Tienes una historia que contar?</h2>
          <p className="text-slate-300 font-serif text-lg mb-10">Si tienes una denuncia, información de interés público o quieres colaborar, nos interesa escucharte.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto" className="inline-block bg-red-600 text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">Contáctanos</Link>
            <a href="mailto:vizcainosr29@gmail.com" className="inline-block border border-white text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">Escribir al Director</a>
          </div>
        </div>
      </section>
    </main>
  );
}
