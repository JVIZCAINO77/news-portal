const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function triggerBot() {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/cron/bot?category=noticias`;
  console.log(`Disparando bot en: ${url}`);
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Manual-Trigger': 'true'
      }
    });
    
    const data = await res.json();
    console.log('Respuesta del servidor:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error al disparar el bot:', error);
  }
}

triggerBot();
