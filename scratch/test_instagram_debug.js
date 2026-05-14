/**
 * scratch/test_instagram_debug.js
 * Prueba Instagram Graph API paso a paso para diagnosticar el problema.
 * Ejecutar: node scratch/test_instagram_debug.js
 */
require('dotenv').config({ path: '.env.local' });

const IG_USER_ID = process.env.INSTAGRAM_USER_ID;
const FB_TOKEN   = process.env.FACEBOOK_PAGE_TOKEN;

// Artículo de prueba con imagen real de Cloudinary
const TEST_IMAGE = 'https://res.cloudinary.com/dkkw77byz/image/upload/v1747170200/imperio-publico/test.jpg';
const SITE_URL   = 'https://imperiopublico.com';

// Usamos la miniatura real de un artículo existente como imagen de prueba
// (imagen estática de Cloudinary, seguro que IG puede accederla)
const IMAGE_URL  = 'https://res.cloudinary.com/dkkw77byz/image/upload/c_fill,w_1080,h_1080/v1/imperio-publico/articles/default.jpg';

async function run() {
  console.log('\n🔍 === DEBUG INSTAGRAM ===');
  console.log('   IG User ID:', IG_USER_ID);
  console.log('   Token (últimos 8):', FB_TOKEN?.slice(-8));

  if (!IG_USER_ID || !FB_TOKEN) {
    console.error('❌ Faltan credenciales INSTAGRAM_USER_ID o FACEBOOK_PAGE_TOKEN en .env.local');
    process.exit(1);
  }

  // ─── PASO 0: Verificar que la cuenta IG es Business y tiene permisos ───
  console.log('\n📋 PASO 0: Verificando cuenta de Instagram...');
  const meRes = await fetch(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}?fields=id,name,username&access_token=${FB_TOKEN}`
  );
  const meData = await meRes.json();
  if (meData.error) {
    console.error('❌ Error verificando cuenta:', JSON.stringify(meData.error, null, 2));
    console.log('\n🔧 POSIBLES CAUSAS:');
    console.log('   1. El token de Facebook expiró (renovar en Meta Business Suite)');
    console.log('   2. El INSTAGRAM_USER_ID es incorrecto');
    console.log('   3. Faltan permisos: instagram_basic, instagram_content_publish');
    process.exit(1);
  }
  console.log('✅ Cuenta verificada:', JSON.stringify(meData, null, 2));

  // ─── PASO 1: Crear contenedor con imagen de Cloudinary ────────────────
  // (Usamos la imagen del artículo más reciente de la BD, o una por defecto)
  // Para la prueba usamos una URL simple de cloudinary
  const imageToTest = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1080&h=1350&fit=crop';
  
  console.log(`\n📦 PASO 1: Creando contenedor con imagen de prueba...`);
  console.log('   Image URL:', imageToTest);

  const caption = [
    '📰 Prueba de auto-publicación — Imperio Público',
    '',
    'Verificando que el sistema de publicación automática funciona correctamente.',
    '',
    '🔗 Link en bio → imperiopublico.com',
    '',
    '#ImperioPublico #NoticiasRD #RepublicaDominicana #Tecnologia',
  ].join('\n');

  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageToTest,
        caption,
        access_token: FB_TOKEN,
      }),
    }
  );
  const containerData = await containerRes.json();
  
  if (!containerData.id) {
    console.error('❌ PASO 1 FALLÓ — Crear contenedor:', JSON.stringify(containerData, null, 2));
    
    if (containerData.error?.code === 190) {
      console.log('\n🔧 FIX: El token de Facebook EXPIRÓ. Ve a Meta Business Suite y genera uno nuevo.');
    } else if (containerData.error?.code === 10) {
      console.log('\n🔧 FIX: Permisos insuficientes. Necesitas: instagram_basic + instagram_content_publish');
    } else if (containerData.error?.code === 100) {
      console.log('\n🔧 FIX: Parámetro inválido — posiblemente el INSTAGRAM_USER_ID es incorrecto.');
    } else if (containerData.error?.error_subcode === 2207026) {
      console.log('\n🔧 FIX: La imagen no es accesible por los servidores de Meta (URL bloqueada o caída).');
    }
    process.exit(1);
  }

  console.log(`✅ Contenedor creado: ${containerData.id}`);

  // ─── PASO 2: Polling del status ────────────────────────────────────────
  console.log('\n⏳ PASO 2: Esperando que Meta procese la imagen...');
  let status = 'IN_PROGRESS';
  for (let i = 0; i < 8; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const stRes = await fetch(
      `https://graph.facebook.com/v19.0/${containerData.id}?fields=status_code,status&access_token=${FB_TOKEN}`
    );
    const stData = await stRes.json();
    status = stData.status_code || 'UNKNOWN';
    console.log(`   Intento ${i + 1}: status = ${status}`);
    if (status === 'FINISHED' || status === 'ERROR') break;
  }

  if (status !== 'FINISHED') {
    console.error(`❌ PASO 2 FALLÓ — Status final: ${status}`);
    process.exit(1);
  }

  console.log('✅ Imagen procesada por Meta (FINISHED)');

  // ─── PASO 3: Publicar ────────────────────────────────────────────────
  console.log('\n🚀 PASO 3: Publicando en Instagram...');
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${IG_USER_ID}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerData.id,
        access_token: FB_TOKEN,
      }),
    }
  );
  const publishData = await publishRes.json();

  if (publishData.id) {
    console.log(`\n🎉 ¡ÉXITO! Instagram publicado: https://www.instagram.com/p/${publishData.id}`);
  } else {
    console.error('❌ PASO 3 FALLÓ — Publicar:', JSON.stringify(publishData, null, 2));
  }
}

run().catch(e => console.error('Error fatal:', e));
