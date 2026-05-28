/**
 * /api/cron/refresh-fb-token
 * ─────────────────────────────────────────────────────────────────
 * Cron diario que verifica y renueva el Facebook Page Token
 * automáticamente antes de que expire.
 *
 * Flujo:
 *  1. Lee el token actual desde Supabase (social_tokens)
 *  2. Si faltan ≤ 15 días para expirar → llama a Meta Graph API
 *     para extenderlo otros 60 días usando el App Secret
 *  3. Guarda el nuevo token en Supabase
 *  4. Si la renovación falla → envía alerta por Telegram (si configurado)
 *
 * Programado: 0 10 * * *  (10 AM UTC = 6 AM RD, todos los días)
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse }  from 'next/server';

export const maxDuration = 30;
export const dynamic     = 'force-dynamic';

const FB_APP_ID     = process.env.FB_APP_ID     || '1630041454741121';
const FB_APP_SECRET = process.env.FB_APP_SECRET  || null;
const FB_PAGE_ID    = process.env.FACEBOOK_PAGE_ID || '1070862352777957';
const RENEWAL_DAYS  = 15; // renovar si quedan ≤ 15 días

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

async function sendTelegramAlert(message) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
    });
  } catch (_) {}
}

export async function GET(req) {
  // Verificar autorización (cron de Vercel o CRON_SECRET)
  const authHeader = req.headers.get('authorization');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const isAuthorized = isVercelCron || authHeader === `Bearer ${process.env.CRON_SECRET}`;
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const log = [];
  const admin = getAdmin();

  try {
    // 1. Leer token actual desde Supabase
    const { data, error } = await admin
      .from('social_tokens')
      .select('token, expires_at, notes')
      .eq('id', 'facebook_page')
      .single();

    if (error || !data?.token) {
      const msg = '⚠️ [FbToken Cron] No hay token en Supabase. Renovación imposible.';
      log.push(msg);
      await sendTelegramAlert(`🚨 <b>Imperio Público — Alerta Token FB</b>\n\n${msg}\n\nAcción requerida: Configurar token manualmente.`);
      return NextResponse.json({ status: 'no_token', log });
    }

    // 2. Calcular días restantes
    const expiresAt  = data.expires_at ? new Date(data.expires_at) : null;
    const daysLeft   = expiresAt
      ? Math.max(0, Math.floor((expiresAt - Date.now()) / 86400000))
      : 999;

    log.push(`Token actual expira: ${expiresAt?.toLocaleDateString('es-DO') || 'indefinido'} (${daysLeft} días)`);

    if (daysLeft > RENEWAL_DAYS) {
      log.push(`✅ Token OK — quedan ${daysLeft} días. No se requiere renovación.`);
      return NextResponse.json({ status: 'ok', daysLeft, log });
    }

    // 3. Intentar renovar via App Secret
    log.push(`⚠️ Quedan ${daysLeft} días — iniciando renovación automática...`);

    if (!FB_APP_SECRET) {
      const msg = '❌ FB_APP_SECRET no configurado. Renovación automática imposible.';
      log.push(msg);
      await sendTelegramAlert(
        `🚨 <b>Imperio Público — Token Facebook</b>\n\n` +
        `El token expira en <b>${daysLeft} días</b> (${expiresAt?.toLocaleDateString('es-DO')}).\n\n` +
        `Renovación automática falló: FB_APP_SECRET no configurado.\n` +
        `Acción requerida: Renovar manualmente en Meta Developers.`
      );
      return NextResponse.json({ status: 'error', reason: 'no_app_secret', daysLeft, log });
    }

    // Llamar a Graph API para extender el token
    const extendUrl = `https://graph.facebook.com/v22.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${FB_APP_ID}` +
      `&client_secret=${FB_APP_SECRET}` +
      `&fb_exchange_token=${data.token}`;

    const extendRes  = await fetch(extendUrl);
    const extendData = await extendRes.json();

    if (extendData.error || !extendData.access_token) {
      const errMsg = extendData.error?.message || 'Error desconocido';
      log.push(`❌ Extensión falló: ${errMsg}`);
      await sendTelegramAlert(
        `🚨 <b>Imperio Público — Token Facebook</b>\n\n` +
        `El token expira en <b>${daysLeft} días</b>.\n` +
        `La renovación automática falló: <code>${errMsg}</code>\n\n` +
        `Renovar manualmente en: https://developers.facebook.com/tools/explorer/`
      );
      return NextResponse.json({ status: 'error', reason: errMsg, daysLeft, log });
    }

    // 4. Obtener el Page Token usando el token extendido
    const newUserToken   = extendData.access_token;
    const pageTokenRes   = await fetch(
      `https://graph.facebook.com/v22.0/${FB_PAGE_ID}?fields=access_token&access_token=${newUserToken}`
    );
    const pageTokenData  = await pageTokenRes.json();
    const newPageToken   = pageTokenData.access_token || newUserToken;

    // 5. Guardar en Supabase
    const newExpiry = new Date(Date.now() + 59 * 24 * 60 * 60 * 1000);
    await admin.from('social_tokens').update({
      token:      newPageToken,
      expires_at: newExpiry.toISOString(),
      updated_at: new Date().toISOString(),
      notes:      `Auto-renovado el ${new Date().toLocaleDateString('es-DO')} — expira ${newExpiry.toLocaleDateString('es-DO')}`,
    }).eq('id', 'facebook_page');

    log.push(`✅ Token renovado exitosamente. Nuevo vencimiento: ${newExpiry.toLocaleDateString('es-DO')}`);

    // Notificar renovación exitosa
    await sendTelegramAlert(
      `✅ <b>Imperio Público — Token Facebook Renovado</b>\n\n` +
      `El token de Facebook fue renovado automáticamente.\n` +
      `Nuevo vencimiento: <b>${newExpiry.toLocaleDateString('es-DO')}</b>`
    );

    return NextResponse.json({ status: 'renewed', newExpiry: newExpiry.toISOString(), log });

  } catch (err) {
    log.push(`❌ Error inesperado: ${err.message}`);
    return NextResponse.json({ status: 'error', error: err.message, log }, { status: 500 });
  }
}
