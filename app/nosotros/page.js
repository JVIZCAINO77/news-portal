export const metadata = {
  title: 'Acerca de Nosotros | PulsoNoticias',
  description: 'Conoce la misión, visión y el equipo editorial responsable de PulsoNoticias.',
};

export default function NosotrosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" style={{ color: 'var(--color-text)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 36, fontWeight: 900, marginBottom: 24, color: '#fff' }}>
        Acerca de Nosotros
      </h1>
      
      <div style={{ lineHeight: 1.8, fontSize: 17, backgroundColor: 'var(--color-dark-2)', padding: '40px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
        
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Nuestra Misión</h2>
        <p style={{ marginBottom: 24 }}>
          En <strong>PulsoNoticias</strong>, nuestra misión es democratizar la información proporcionando noticias fiables, 
          cuyos focos principales son la inmediatez, la imparcialidad y la veracidad. Buscamos ser el pulso que conecta 
          los acontecimientos globales con las mentes de nuestros lectores locales e internacionales.
        </p>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 16 }}>Nuestra Visión</h2>
        <p style={{ marginBottom: 24 }}>
          Aspiramos a convertirnos en el periódico digital de mayor confianza en la región, adoptando las tecnologías 
          más vanguardistas como el periodismo asistido por datos y la inteligencia artificial para asegurar que cada 
          historia sea contada con la más alta rigurosidad y en tiempo real.
        </p>

        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 16 }}>Equipo Editorial</h2>
        <p style={{ marginBottom: 16 }}>
          Detrás de PulsoNoticias existe un equipo editorial humano comprometido con la ética periodística. 
          Además, nos apoyamos en sistemas de generación y corrección algorítmica para procesar elevados volúmenes 
          de cables de noticias de agencias internacionales (como EFE, Reuters, AP), garantizando que las primicias 
          lleguen primero a tus manos.
        </p>
        
        <p style={{ marginTop: 40, fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
          "El periodismo es libre, o es una farsa." — Principios fundacionales de PulsoNoticias.
        </p>
      </div>
    </div>
  );
}
