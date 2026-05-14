/**
 * scripts/get-fb-token.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Convierte tu token temporal del Graph API Explorer en un Page Access Token
 * de LARGA DURACIÓN (nunca expira si la app sigue activa).
 *
 * USO:
 *   1. Pon tu token de corta duración en FB_SHORT_TOKEN (abajo)
 *   2. Pon tu App ID y App Secret (de developers.facebook.com → Tu App → Configuración básica)
 *   3. Ejecuta: node scripts/get-fb-token.js
 */

require('dotenv').config({ path: '.env.local' });

// ─── COMPLETA ESTOS 3 VALORES ─────────────────────────────────────────────────
const FB_APP_ID      = process.env.FB_APP_ID      || 'PON_TU_APP_ID_AQUÍ';
const FB_APP_SECRET  = process.env.FB_APP_SECRET  || 'PON_TU_APP_SECRET_AQUÍ';
const FB_SHORT_TOKEN = process.env.FB_SHORT_TOKEN || 'PON_TU_TOKEN_CORTO_AQUÍ';
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔑 Intercambiando token corto por token de larga duración...\n');

  // PASO 1: Obtener Long-Lived User Token
  const llRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token` +
    `?grant_type=fb_exchange_token` +
    `&client_id=${FB_APP_ID}` +
    `&client_secret=${FB_APP_SECRET}` +
    `&fb_exchange_token=${FB_SHORT_TOKEN}`
  );
  const llData = await llRes.json();

  if (llData.error) {
    console.error('❌ Error al obtener long-lived token:', llData.error.message);
    console.error('   Verifica que el App ID, App Secret y token corto sean correctos.');
    process.exit(1);
  }

  const longLivedUserToken = llData.access_token;
  console.log('✅ Long-Lived User Token obtenido (expira en ~60 días).\n');

  // PASO 2: Listar páginas disponibles y obtener el Page Token permanente
  const pagesRes = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${longLivedUserToken}`
  );
  const pagesData = await pagesRes.json();

  if (pagesData.error) {
    console.error('❌ Error al obtener páginas:', pagesData.error.message);
    process.exit(1);
  }

  if (!pagesData.data || pagesData.data.length === 0) {
    console.error('❌ No se encontraron páginas de Facebook en tu cuenta.');
    console.error('   Asegúrate de ser ADMINISTRADOR de la página.');
    process.exit(1);
  }

  console.log(`📄 Páginas encontradas: ${pagesData.data.length}\n`);
  console.log('─'.repeat(60));

  for (const page of pagesData.data) {
    console.log(`\n📘 Página: ${page.name}`);
    console.log(`   ID:     ${page.id}`);
    console.log(`   Token:  ${page.access_token.slice(0, 20)}...`);
    console.log(`   Roles:  ${page.tasks?.join(', ') || 'N/A'}`);
  }

  // Si hay exactamente una página, mostramos las variables listas para copiar
  const page = pagesData.data[0];
  console.log('\n' + '═'.repeat(60));
  console.log('✅ COPIA ESTAS LÍNEAS EN TU .env.local Y EN VERCEL:\n');
  console.log(`FACEBOOK_PAGE_ID=${page.id}`);
  console.log(`FACEBOOK_PAGE_TOKEN=${page.access_token}`);
  console.log('\n' + '═'.repeat(60));
  console.log('\n💡 El Page Access Token de larga duración NUNCA expira');
  console.log('   mientras tu app permanezca activa en Facebook Developers.');

  if (pagesData.data.length > 1) {
    console.log('\n⚠️  Tienes múltiples páginas. Usa el ID y token de la página correcta.');
    console.log('   Todas las páginas disponibles:\n');
    pagesData.data.forEach(p => {
      console.log(`   FACEBOOK_PAGE_ID=${p.id}   ← ${p.name}`);
      console.log(`   FACEBOOK_PAGE_TOKEN=${p.access_token}\n`);
    });
  }
}

main().catch(err => {
  console.error('❌ Error inesperado:', err.message);
  process.exit(1);
});
