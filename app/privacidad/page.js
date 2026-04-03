export const metadata = {
  title: 'Política de Privacidad | PulsoNoticias',
  description: 'Conoce nuestra política de privacidad, el uso de cookies y publicidad de Google AdSense.',
};

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12" style={{ color: 'var(--color-text)' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, marginBottom: 24, color: '#fff' }}>
        Política de Privacidad
      </h1>
      
      <div style={{ lineHeight: 1.8, fontSize: 16 }}>
        <p style={{ marginBottom: 16 }}>
          En <strong>PulsoNoticias</strong>, accesible desde nuestro portal, una de nuestras principales prioridades es la privacidad de nuestros visitantes. 
          Este documento de Política de Privacidad contiene los tipos de información recopilada y cómo la utilizamos.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 16 }}>
          Google AdSense y la cookie de DART de DoubleClick
        </h2>
        <p style={{ marginBottom: 16 }}>
          Google es un proveedor de terceros en nuestro sitio web. Como tal, utiliza cookies, conocidas como cookies de DART, 
          para mostrar anuncios a los visitantes de nuestro sitio web en función de sus visitas a este y otros sitios de Internet. 
          Sin embargo, los visitantes pueden optar por rechazar el uso de cookies de DART visitando la Política de privacidad 
          de la red de contenido y anuncios de Google en la siguiente URL: 
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', marginLeft: 4 }}>
            https://policies.google.com/technologies/ads
          </a>.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 16 }}>
          Nuestros Socios Publicitarios
        </h2>
        <p style={{ marginBottom: 16 }}>
          Algunos anunciantes en nuestro sitio pueden usar cookies y balizas web. Nuestros socios publicitarios 
          tienen cada uno su propia Política de Privacidad para sus políticas sobre los datos de los usuarios. 
          Principalmente utilizamos <strong>Google AdSense</strong>.
        </p>
        <p style={{ marginBottom: 16 }}>
          Estos servidores de anuncios de terceros o redes publicitarias utilizan tecnologías como cookies, 
          JavaScript o Web Beacons que se envían directamente al navegador de los usuarios a través de sus respectivos anuncios.
          Reciben automáticamente tu dirección IP cuando esto ocurre.
        </p>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 32, marginBottom: 16 }}>
          Consentimiento
        </h2>
        <p style={{ marginBottom: 16 }}>
          Al utilizar nuestro sitio web, usted acepta nuestra Política de Privacidad y acepta sus términos.
        </p>
      </div>
    </div>
  );
}
