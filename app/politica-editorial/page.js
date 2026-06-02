// app/politica-editorial/page.js � Pol�tica Editorial (Imperio P�blico)
export const dynamic = 'force-static';

export const metadata = {
  title: 'Pol�tica Editorial | Imperio P�blico',
  description: 'Conoce los principios, procesos y est�ndares editoriales que rigen la producci�n de contenido period�stico en Imperio P�blico. Transparencia total sobre c�mo trabajamos.',
  alternates: { canonical: 'https://imperiopublico.com/politica-editorial' },
};

export default function PoliticaEditorialPage() {
  return (
    <main className="bg-white min-h-screen">
      <header className="bg-gray-50 border-b border-gray-100 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <span className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 mb-4 block">C�mo Trabajamos</span>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none italic mb-6">
            Pol�tica <span className="text-red-600">Editorial</span>
          </h1>
          <p className="text-lg font-serif text-slate-600 leading-relaxed">
            Este documento describe los est�ndares, procesos y principios �ticos que rigen toda
            la producci�n period�stica de Imperio P�blico. Es nuestra promesa p�blica de transparencia
            con nuestros lectores.
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-4">
            �ltima actualizaci�n: Mayo 2026
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
            <p>Imperio P�blico es un medio de comunicaci�n digital independiente. No pertenece ni est� afiliado a ning�n partido pol�tico, organizaci�n gubernamental, grupo empresarial ni instituci�n religiosa de la Rep�blica Dominicana o del exterior.</p>
            <p>Las decisiones sobre qu� noticias publicar, c�mo enfocarlas y qu� fuentes consultar las toma exclusivamente el equipo editorial, sin interferencia de anunciantes, patrocinadores o entidades externas.</p>
            <p>Los anunciantes que aparecen en nuestro sitio no tienen ninguna influencia sobre el contenido editorial. La separaci�n entre publicidad y periodismo es absoluta.</p>
          </div>
        </section>

        {/* 2. Proceso de verificaci�n */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            2. Proceso de Verificaci�n de la Informaci�n
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Antes de publicar cualquier noticia, seguimos el siguiente proceso:</p>
            <ol className="list-decimal pl-6 space-y-3 text-base">
              <li><strong>Identificaci�n de fuentes primarias:</strong> Buscamos documentos oficiales, declaraciones directas y testimonios de primera mano.</li>
              <li><strong>Contraste con al menos dos fuentes independientes</strong> para noticias de alto impacto.</li>
              <li><strong>Consulta a los aludidos:</strong> Cuando una noticia puede afectar la reputaci�n de una persona o instituci�n, solicitamos su versi�n antes de publicar.</li>
              <li><strong>Revisi�n editorial:</strong> Un editor revisa el art�culo para verificar la coherencia entre el titular, el contenido y las fuentes citadas.</li>
              <li><strong>Publicaci�n con autor�a:</strong> Cada art�culo identifica claramente a su autor o a la secci�n responsable.</li>
            </ol>
          </div>
        </section>

        {/* 3. Uso de tecnolog�a e IA */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            3. Uso de Tecnolog�a e Inteligencia Artificial
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Imperio P�blico utiliza herramientas tecnol�gicas, incluyendo inteligencia artificial, como apoyo en el proceso de producci�n period�stica. Sin embargo, establecemos l�mites claros en su uso:</p>
            <ul className="list-disc pl-6 space-y-3 text-base">
              <li>La IA se usa para el procesamiento inicial de informaci�n, estructuraci�n de datos y redacci�n de borradores a partir de hechos verificados previamente.</li>
              <li>Ning�n art�culo se publica sin revisi�n editorial humana que verifique la precisi�n factual, el contexto y el tono.</li>
              <li>La IA no reemplaza el criterio period�stico: decide qu� noticias son relevantes, c�mo contextualizarlas y cu�ndo publicarlas el equipo editorial.</li>
              <li>Los art�culos de opini�n, an�lisis profundo y entrevistas son producidos �ntegramente por periodistas humanos.</li>
            </ul>
          </div>
        </section>

        {/* 4. Conflictos de inter�s */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            4. Conflictos de Inter�s
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Los periodistas y editores de Imperio P�blico est�n obligados a declarar cualquier relaci�n personal, econ�mica o pol�tica que pueda influir en su cobertura de un tema espec�fico.</p>
            <p>Cuando existe un potencial conflicto de inter�s, el periodista involucrado se aparta del cubrimiento de ese tema y se asigna a otro miembro del equipo sin esa vinculaci�n.</p>
            <p>Imperio P�blico no acepta pagos, regalos, viajes ni beneficios de ning�n tipo de fuentes, instituciones o empresas que puedan comprometer nuestra independencia.</p>
          </div>
        </section>

        {/* 5. Fuentes y atribuci�n */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            5. Fuentes y Atribuci�n
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Imperio P�blico se compromete a:</p>
            <ul className="list-disc pl-6 space-y-3 text-base">
              <li>Identificar las fuentes siempre que sea posible y �ticamente viable.</li>
              <li>Explicar al lector por qu� una fuente pidi� anonimato, sin revelar su identidad.</li>
              <li>Citar y enlazar a los medios originales cuando una historia es derivada de otra publicaci�n.</li>
              <li>No publicar rumores como hechos: si una informaci�n no est� confirmada, se identifica expl�citamente como no verificada.</li>
            </ul>
          </div>
        </section>

        {/* 6. Correcciones y actualizaciones */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            6. Correcciones y Actualizaciones
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Cuando se detecta un error en un art�culo publicado:</p>
            <ol className="list-decimal pl-6 space-y-3 text-base">
              <li>El art�culo se corrige de inmediato.</li>
              <li>Se a�ade una nota de correcci�n visible que indica qu� se corrigi�, cu�ndo y por qu�.</li>
              <li>En errores significativos, se publica una nota editorial separada.</li>
              <li>Nunca se eliminan art�culos silenciosamente: todas las modificaciones quedan registradas.</li>
            </ol>
            <p>Para reportar un error: <a href="mailto:jvizcaino242@gmail.com" className="text-red-600 font-bold hover:underline">jvizcaino242@gmail.com</a></p>
          </div>
        </section>

        {/* 7. Contenido patrocinado */}
        <section>
          <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-6 border-l-4 border-red-600 pl-6">
            7. Publicidad y Contenido Patrocinado
          </h2>
          <div className="space-y-4 font-serif text-lg text-slate-700 leading-relaxed pl-6">
            <p>Imperio P�blico distingue claramente entre contenido period�stico y contenido publicitario:</p>
            <ul className="list-disc pl-6 space-y-3 text-base">
              <li>Los anuncios aparecen en espacios designados y est�n claramente identificados con la etiqueta &quot;Publicidad&quot;.</li>
              <li>El contenido patrocinado, cuando existe, se identifica expl�citamente como tal.</li>
              <li>No publicamos art�culos pagados disfrazados de periodismo. Si un contenido es patrocinado, lo decimos.</li>
              <li>Los anunciantes no tienen acceso a decisiones editoriales ni pueden solicitar la modificaci�n o eliminaci�n de contenido.</li>
            </ul>
          </div>
        </section>

        {/* Contacto */}
        <section className="bg-gray-50 p-10 border-l-4 border-red-600">
          <h2 className="text-xl font-black uppercase tracking-tighter mb-4">�Preguntas sobre esta pol�tica?</h2>
          <p className="font-serif text-slate-700 mb-4">
            Si tienes preguntas sobre nuestra pol�tica editorial, o si deseas reportar una preocupaci�n
            sobre nuestros est�ndares period�sticos, cont�ctanos directamente:
          </p>
          <div className="space-y-2">
            <p className="text-sm font-bold">
              <span className="text-red-600 uppercase tracking-widest text-[10px]">Director:</span>{' '}
              <a href="mailto:jvizcaino242@gmail.com" className="hover:text-red-600 transition-colors">jvizcaino242@gmail.com</a>
            </p>
            <p className="text-sm font-bold">
              <span className="text-red-600 uppercase tracking-widest text-[10px]">Redacci�n:</span>{' '}
              <a href="mailto:jvizcaino242@gmail.com" className="hover:text-red-600 transition-colors">jvizcaino242@gmail.com</a>
            </p>
          </div>
        </section>

      </div>
    </main>
  );
}
