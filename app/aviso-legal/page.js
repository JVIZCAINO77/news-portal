export const metadata = {
  title: 'Aviso Legal | PulsoNoticias',
  description: 'Términos de uso, descargo de responsabilidad y aviso legal del portal PulsoNoticias.',
};

export default function AvisoLegalPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" style={{ color: 'var(--color-text)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, marginBottom: 24, color: '#fff' }}>
        Aviso Legal y Descargo de Responsabilidad
      </h1>
      
      <div style={{ lineHeight: 1.8, fontSize: 16 }}>
        <p style={{ marginBottom: 24 }}>
          Toda la información proporcionada en el portal <strong>PulsoNoticias</strong> se publica de buena fe y 
          exclusivamente con fines informativos generales. No ofrecemos ninguna garantía sobre la integridad, fiabilidad y 
          precisión de esta información.
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 16 }}>1. Derechos de Autor y Propiedad Intelectual</h2>
        <p style={{ marginBottom: 16 }}>
          Los textos, estructura editorial, códigos y diseños desarrollados por PulsoNoticias son propiedad exclusiva 
          del portal. Está permitida la reproducción parcial de nuestros artículos siempre y cuando se cite y enlace 
          a la fuente original. Las imágenes utilizadas, en caso de no ser propias, pertenecen a sus respectivos dueños 
          y se utilizan bajo la premisa de "Uso Justo" (Fair Use) para el reporte de noticias.
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 16 }}>2. Responsabilidad de Contenidos Externos</h2>
        <p style={{ marginBottom: 16 }}>
          Desde nuestro sitio web, usted puede visitar otros sitios web de terceros, incluyendo anunciantes, siguiendo 
          hipervínculos a dichos sitios externos. Aunque nos esforzamos por proporcionar solo enlaces en los que confiamos, 
          no tenemos control sobre el contenido y la naturaleza de estos sitios web de terceros. 
          Al hacer clic en publicidad proveída por <strong>Google AdSense</strong> o redes similares, los términos 
          de interacción dependen exclusivamente de dicho anunciante.
        </p>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 16 }}>3. Uso de Inteligencia Artificial</h2>
        <p style={{ marginBottom: 16 }}>
          PulsoNoticias utiliza tecnología de Inteligencia Artificial como herramienta de asistencia periodística 
          para la redacción y síntesis de informaciones de alcance público. El equipo editorial audita y configura 
          dichas herramientas para asegurar que la calidad periodística y el principio de veracidad humana prevalezcan en cada artículo.
        </p>

        <p style={{ marginTop: 40, fontStyle: 'italic', fontSize: 14, color: 'var(--color-text-muted)' }}>
          Al utilizar nuestro sitio web, usted acepta nuestro descargo de responsabilidad y acepta sus términos. 
          Última actualización: Abril de 2026.
        </p>
      </div>
    </div>
  );
}
