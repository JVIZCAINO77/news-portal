export const metadata = {
  title: 'Contacto | PulsoNoticias',
  description: 'Comunícate con la redacción de PulsoNoticias.',
};

export default function ContactoPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12" style={{ color: 'var(--color-text)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, marginBottom: 24, color: '#fff', textAlign: 'center' }}>
        Contacto
      </h1>
      
      <div style={{ backgroundColor: 'var(--color-dark-2)', padding: '40px', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
        <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 32, textAlign: 'center' }}>
          ¿Tienes alguna propuesa comercial, consulta publicitaria o quieres enviarnos una noticia? <br/>
          Ponte en contacto con nuestro equipo editorial para colaborar.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Ventas y Publicidad</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Para espacios publicitarios o colaboraciones estratégicas.</p>
            <a href="mailto:ventas@pulsonoticias.com" style={{ display: 'inline-block', marginTop: 12, color: 'var(--color-primary)', fontWeight: 600 }}>ventas@pulsonoticias.com</a>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>Redacción y Prensa</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Para pistas, notas de prensa y contacto con nuestros periodistas.</p>
            <a href="mailto:redaccion@pulsonoticias.com" style={{ display: 'inline-block', marginTop: 12, color: 'var(--color-primary)', fontWeight: 600 }}>redaccion@pulsonoticias.com</a>
          </div>
        </div>

        <p style={{ marginTop: 40, textAlign: 'center', fontSize: 14, color: 'var(--color-text-muted)' }}>
          PulsoNoticias. Tu fuente de noticias y entretenimiento en tiempo real.
        </p>
      </div>
    </div>
  );
}
