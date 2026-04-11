export default function TestPage() {
  return (
    <div style={{ padding: '100px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '50px' }}>🚀 DESPLIEGUE EXITOSO</h1>
      <p>Si estás viendo esto, el servidor está recibiendo los cambios de AdSense correctamente.</p>
      <p>Fecha de prueba: {new Date().toLocaleString()}</p>
    </div>
  );
}
