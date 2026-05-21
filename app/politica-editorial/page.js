// app/politica-editorial/page.js — Política Editorial (Imperio Público)
export const dynamic = 'force-static';

export const metadata = {
  title: 'Política Editorial | Imperio Público',
  description: 'Conoce los principios, procesos y estándares editoriales que rigen la producción de contenido periodístico en Imperio Público. Transparencia total sobre cómo trabajamos.',
  alternates: { canonical: 'https://imperiopublico.com/politica-editorial' },
};

export default function PoliticaEditorialPage() {
  return (
    <main className="bg-white min-h-screen">
      <header className="bg-gray-50 border-b border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 mb-4 block">Cómo Trabajamos</span>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none italic mb-6">
            Política <span className="text-red-600">Editorial</span>
          </h1>
          <p className="text-lg font-serif text-slate-600 leading-relaxed">
            Este documento describe los estándares, procesos y principios éticos que rigen toda
            la producción periodística de Imperio Público. Es nuestra promesa pública de transparencia
            con nuestros lectores.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4">
            Última actualización: Mayo 2026
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">

        {/* 1. Independencia */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            1. Independencia Editorial
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Imperio Público es un medio de comunicación digital independiente. No pertenece ni está afiliado a ningún partido político, organización gubernamental, grupo empresarial ni institución religiosa de la República Dominicana o del exterior.</p>
            <p>Las decisiones sobre qué noticias publicar, cómo enfocarlas y qué fuentes consultar las toma exclusivamente el equipo editorial, sin interferencia de anunciantes, patrocinadores o entidades externas.</p>
            <p>Los anunciantes que aparecen en nuestro sitio no tienen ninguna influencia sobre el contenido editorial. La separación entre publicidad y periodismo es absoluta.</p>
          </div>
        </section>

        {/* 2. Proceso de verificación */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            2. Proceso de Verificación de la Información
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Antes de publicar cualquier noticia, seguimos el siguiente proceso:</p>
            <ol className="list-decimal pl-6 space-y-3 text-base">
              <li><strong>Identificación de fuentes primarias:</strong> Buscamos documentos oficiales, declaraciones directas y testimonios de primera mano.</li>
              <li><strong>Contraste con al menos dos fuentes independientes</strong> para noticias de alto impacto.</li>
              <li><strong>Consulta a los aludidos:</strong> Cuando una noticia puede afectar la reputación de una persona o institución, solicitamos su versión antes de publicar.</li>
              <li><strong>Revisión editorial:</strong> Un editor revisa el artículo para verificar la coherencia entre el titular, el contenido y las fuentes citadas.</li>
              <li><strong>Publicación con autoría:</strong> Cada artículo identifica claramente a su autor o a la sección responsable.</li>
            </ol>
          </div>
        </section>

        {/* 3. Uso de tecnología e IA */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            3. Uso de Tecnología e Inteligencia Artificial
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Imperio Público utiliza herramientas tecnológicas, incluyendo inteligencia artificial, como apoyo en el proceso de producción periodística. Sin embargo, establecemos límites claros en su uso:</p>
            <ul className="list-disc pl-6 space-y-3 text-base">
              <li>La IA se usa para el procesamiento inicial de información, estructuración de datos y redacción de borradores a partir de hechos verificados previamente.</li>
              <li>Ningún artículo se publica sin revisión editorial humana que verifique la precisión factual, el contexto y el tono.</li>
              <li>La IA no reemplaza el criterio periodístico: decide qué noticias son relevantes, cómo contextualizarlas y cuándo publicarlas el equipo editorial.</li>
              <li>Los artículos de opinión, análisis profundo y entrevistas son producidos íntegramente por periodistas humanos.</li>
            </ul>
          </div>
        </section>

        {/* 4. Conflictos de interés */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            4. Conflictos de Interés
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Los periodistas y editores de Imperio Público están obligados a declarar cualquier relación personal, económica o política que pueda influir en su cobertura de un tema específico.</p>
            <p>Cuando existe un potencial conflicto de interés, el periodista involucrado se aparta del cubrimiento de ese tema y se asigna a otro miembro del equipo sin esa vinculación.</p>
            <p>Imperio Público no acepta pagos, regalos, viajes ni beneficios de ningún tipo de fuentes, instituciones o empresas que puedan comprometer nuestra independencia.</p>
          </div>
        </section>

        {/* 5. Fuentes y atribución */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            5. Fuentes y Atribución
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Imperio Público se compromete a:</p>
            <ul className="list-disc pl-6 space-y-3 text-base">
              <li>Identificar las fuentes siempre que sea posible y éticamente viable.</li>
              <li>Explicar al lector por qué una fuente pidió anonimato, sin revelar su identidad.</li>
              <li>Citar y enlazar a los medios originales cuando una historia es derivada de otra publicación.</li>
              <li>No publicar rumores como hechos: si una información no está confirmada, se identifica explícitamente como no verificada.</li>
            </ul>
          </div>
        </section>

        {/* 6. Correcciones y actualizaciones */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            6. Correcciones y Actualizaciones
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Cuando se detecta un error en un artículo publicado:</p>
            <ol className="list-decimal pl-6 space-y-3 text-base">
              <li>El artículo se corrige de inmediato.</li>
              <li>Se añade una nota de corrección visible que indica qué se corrigió, cuándo y por qué.</li>
              <li>En errores significativos, se publica una nota editorial separada.</li>
              <li>Nunca se eliminan artículos silenciosamente: todas las modificaciones quedan registradas.</li>
            </ol>
            <p>Para reportar un error: <a href="mailto:imperiopublico@gmail.com" className="text-red-600 font-bold hover:underline">imperiopublico@gmail.com</a></p>
          </div>
        </section>

        {/* 7. Contenido patrocinado */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            7. Publicidad y Contenido Patrocinado
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Imperio Público distingue claramente entre contenido periodístico y contenido publicitario:</p>
            <ul className="list-disc pl-6 space-y-3 text-base">
              <li>Los anuncios aparecen en espacios designados y están claramente identificados con la etiqueta &quot;Publicidad&quot;.</li>
              <li>El contenido patrocinado, cuando existe, se identifica explícitamente como tal.</li>
              <li>No publicamos artículos pagados disfrazados de periodismo. Si un contenido es patrocinado, lo decimos.</li>
              <li>Los anunciantes no tienen acceso a decisiones editoriales ni pueden solicitar la modificación o eliminación de contenido.</li>
            </ul>
          </div>
        </section>

        {/* Contacto */}
        <section className="bg-gray-50 p-10 border-l-4 border-red-600">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-4">¿Preguntas sobre esta política?</h2>
          <p className="font-serif text-slate-700 mb-4">
            Si tienes preguntas sobre nuestra política editorial, o si deseas reportar una preocupación
            sobre nuestros estándares periodísticos, contáctanos directamente:
          </p>
          <div className="space-y-2">
            <p className="text-sm font-bold">
              <span className="text-red-600 uppercase tracking-widest text-[10px]">Director:</span>{' '}
              <a href="mailto:imperiopublico@gmail.com" className="hover:text-red-600 transition-colors">imperiopublico@gmail.com</a>
            </p>
            <p className="text-sm font-bold">
              <span className="text-red-600 uppercase tracking-widest text-[10px]">Redacción:</span>{' '}
              <a href="mailto:imperiopublico@gmail.com" className="hover:text-red-600 transition-colors">imperiopublico@gmail.com</a>
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
