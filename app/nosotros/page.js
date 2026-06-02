// app/nosotros/page.js � Sobre Nosotros (Imperio P�blico) � Versi�n editorial completa
import Link from 'next/link';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Sobre Nosotros | Imperio P�blico � Periodismo Dominicano',
  description: 'Imperio P�blico es un medio digital independiente dominicano fundado para hacer periodismo veraz y responsable. Conoce nuestra historia, equipo editorial y principios �ticos.',
  alternates: { canonical: 'https://imperiopublico.com/nosotros' },
};

const TEAM = [
  { name: 'Jos� Vizca�no', role: 'Director y Fundador', email: 'jvizcaino242@gmail.com', bio: 'Periodista digital y emprendedor de medios con m�s de 8 a�os de experiencia en comunicaci�n, cobertura pol�tica y producci�n de contenido para audiencias dominicanas dentro y fuera del pa�s. Fund� Imperio P�blico con la convicci�n de que la Rep�blica Dominicana merece un medio digital �gil, veraz e independiente que priorice al ciudadano.' },
  { name: 'Mesa Pol�tica', role: 'Editores de Pol�tica Nacional', email: 'redaccion@imperiopublico.com', bio: 'Equipo especializado en cobertura del poder ejecutivo, legislativo y judicial dominicano. Con fuentes en el Congreso Nacional y la Presidencia, ofrecen an�lisis profundo de cada decisi�n que impacta la vida de los ciudadanos.' },
  { name: 'Mesa Deportiva', role: 'Editores de Deportes', email: 'deportes@imperiopublico.com', bio: 'Periodistas con seguimiento cercano al b�isbol dominicano en las Grandes Ligas, la Liga Dominicana de B�isbol y los seleccionados nacionales, con an�lisis que va m�s all� del marcador.' },
  { name: 'Redacci�n Econ�mica', role: 'Econom�a y Finanzas', email: 'economia@imperiopublico.com', bio: 'Analistas que traducen los datos macroecon�micos a un lenguaje accesible. Cubren el d�lar, la inflaci�n, el sector empresarial y las pol�ticas del Banco Central con rigor y contexto ciudadano.' },
  { name: 'Secci�n Internacional', role: 'Noticias Mundiales', email: 'internacional@imperiopublico.com', bio: 'Periodistas con visi�n global que seleccionan y contextualizan los eventos internacionales de mayor impacto para la audiencia dominicana, desde la geopol�tica al cambio clim�tico.' },
  { name: 'Redacci�n Digital', role: 'Tecnolog�a y Redes', email: 'digital@imperiopublico.com', bio: 'Especialistas en distribuci�n de contenido digital, SEO period�stico y redes sociales. Garantizan que cada noticia llegue al mayor n�mero de dominicanos posible en el momento oportuno.' },
];

const PRINCIPLES = [
  { title: 'Veracidad ante todo', desc: 'Publicamos solo informaci�n verificada. Ante la duda, preferimos esperar a la confirmaci�n antes que publicar una primicia equivocada. La credibilidad de Imperio P�blico vale m�s que cualquier clic.' },
  { title: 'Independencia editorial', desc: 'Imperio P�blico no pertenece a ning�n partido pol�tico, grupo empresarial ni entidad gubernamental. Nuestras decisiones editoriales las toma exclusivamente la redacci�n.' },
  { title: 'Correcci�n transparente', desc: 'Cuando cometemos un error, lo corregimos de forma expl�cita y visible. No borramos art�culos: los corregimos con una nota que explica qu� cambi� y por qu�.' },
  { title: 'Protecci�n de fuentes', desc: 'Protegemos a nuestras fuentes confidenciales. Cuando alguien nos conf�a informaci�n bajo reserva de identidad, esa confianza es sagrada y nunca ser� traicionada.' },
  { title: 'Contexto y pluralidad', desc: 'Buscamos activamente las versiones de todos los involucrados. El periodismo no es un mon�logo: es la suma de perspectivas que permite al lector formarse su propia opini�n.' },
  { title: 'Inter�s p�blico', desc: 'Nuestra selecci�n se gu�a por una pregunta: �le importa esto al ciudadano dominicano? Si la respuesta es s�, lo cubrimos con el rigor que el tema merece.' },
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
            Imperio P�blico es un medio digital independiente dominicano. Hacemos periodismo veraz,
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
                <p>Imperio P�blico naci� en 2024 de la convicci�n de que la Rep�blica Dominicana necesitaba un medio digital que priorizara la informaci�n de inter�s ciudadano sobre los titulares sensacionalistas y los intereses pol�ticos.</p>
                <p>Desde nuestros primeros art�culos, establecimos un est�ndar: cada noticia debe estar verificada, contextualizada y presentada de forma que el lector no solo sepa qu� pas�, sino por qu� importa.</p>
                <p>Hoy, Imperio P�blico cubre 12 secciones tem�ticas con un equipo editorial dedicado a mantener los m�s altos est�ndares del periodismo digital latinoamericano. M�s de 1,000 art�culos publicados avalan nuestro compromiso con la informaci�n de calidad.</p>
              </div>
            </div>
            <div className="lg:col-span-5">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 block">Hitos</span>
              <div className="space-y-6 border-l-2 border-gray-100 pl-6">
                {[
                  { year: '2024', event: 'Fundaci�n de Imperio P�blico como portal digital dominicano independiente.' },
                  { year: '2025', event: 'Lanzamiento de cobertura en tiempo real y expansi�n a 12 secciones tem�ticas.' },
                  { year: '2025', event: 'Integraci�n con Google Discover y publicaci�n activa en 4 redes sociales.' },
                  { year: '2026', event: 'Superamos 1,000 art�culos publicados y consolidamos presencia en Google News.' },
                  { year: '2026', event: 'Registro oficial del Nombre Comercial ante la ONAPI (N�m. 931539), consolidando la identidad legal del medio.' },
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

      {/* Misi�n / Visi�n / Valores */}
      <section className="py-20 border-b border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="border-l-4 border-red-600 pl-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4">Misi�n</h2>
              <p className="text-lg font-serif text-slate-800 leading-relaxed">Proveer informaci�n veraz, oportuna y accesible a todos los dominicanos, fiscalizando el poder y contribuyendo al debate democr�tico informado.</p>
            </div>
            <div className="border-l-4 border-black pl-8">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-black mb-4">Visi�n</h2>
              <p className="text-lg font-serif text-slate-800 leading-relaxed">Ser el portal de noticias de referencia de la Rep�blica Dominicana y la di�spora dominicana, reconocido por su excelencia editorial e independencia.</p>
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
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">�tica Period�stica</span>
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
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-4 block">Las Personas Detr�s</span>
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
          <h2 className="text-4xl font-black uppercase tracking-tighter italic mb-8">Pol�tica de Correcciones</h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed">
            <p>En Imperio P�blico reconocemos que el periodismo es un ejercicio humano y susceptible de errores. Cuando detectamos un error factual, procedemos de la siguiente manera:</p>
            <ol className="list-decimal pl-6 space-y-3 text-base">
              <li>A�adimos una nota de correcci�n visible al art�culo original, indicando exactamente qu� informaci�n fue corregida y cu�ndo.</li>
              <li>No eliminamos el contenido original: lo mantenemos con la correcci�n visible para preservar la trazabilidad editorial.</li>
              <li>En errores graves, publicamos una nota editorial separada explicando el error y las medidas adoptadas.</li>
            </ol>
            <p>Para reportar un error: <a href="mailto:jvizcaino242@gmail.com" className="text-red-600 font-bold hover:underline">jvizcaino242@gmail.com</a> con el asunto &quot;Correcci�n&quot;.</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-6">�Tienes una historia que contar?</h2>
          <p className="text-slate-300 font-serif text-lg mb-10">Si tienes una denuncia, informaci�n de inter�s p�blico o quieres colaborar, nos interesa escucharte.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contacto" className="inline-block bg-red-600 text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">Cont�ctanos</Link>
            <a href="mailto:jvizcaino242@gmail.com" className="inline-block border border-white text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all">Escribir al Director</a>
          </div>
        </div>
      </section>
    </main>
  );
}
