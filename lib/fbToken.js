/**
 * lib/fbToken.js — Gestión robusta del Facebook Page Access Token
 * ─────────────────────────────────────────────────────────────────────────────
 * Arquitectura de auto-refresh:
 *
 *  1. Intenta leer el token activo desde Supabase (social_tokens)
 *  2. Si el token está a menos de 7 días de expirar → lo renueva automáticamente
 *     usando el App Token (APP_ID|APP_SECRET) para llamar a /oauth/access_token
 *  3. Si todo falla → usa el fallback de ENV (FACEBOOK_PAGE_TOKEN)
 *
 * Para renovar el token manualmente:
 *   POST /api/admin/refresh-fb-token  (solo admin)
 */

import { createClient } from '@supabase/supabase-js';

const FB_APP_ID     = process.env.FB_APP_ID     || '1630041454741121';
const FB_APP_SECRET = process.env.FB_APP_SECRET || '9ae275dd87d9dd8efc5801ddcb060769';
const FB_PAGE_ID    = process.env.FACEBOOK_PAGE_ID || '1070862352777957';

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

/**
 * Devuelve el Page Access Token activo.
 * Lógica: Supabase → auto-refresh si próximo a expirar → ENV fallback
 */
export async function getFbPageToken() {
  try {
    const admin = getAdmin();

    // 1. Leer de Supabase
    const { data, error } = await admin
      .from('social_tokens')
      .select('token, expires_at, user_token')
      .eq('id', 'facebook_page')
      .single();

    if (error || !data?.token) {
      console.warn('[FbToken] No hay token en Supabase, usando ENV fallback.');
      return process.env.FACEBOOK_PAGE_TOKEN || null;
    }

    // 2. Verificar expiración
    if (data.expires_at) {
      const expiresAt  = new Date(data.expires_at);
      const sevenDays  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      if (expiresAt < sevenDays) {
        console.log('[FbToken] Token próximo a expirar — intentando auto-refresh...');
        const refreshed = await refreshPageToken(data.token, data.user_token, admin);
        if (refreshed) return refreshed;
        console.warn('[FbToken] Auto-refresh falló — usando token existente.');
      }
    }

    return data.token;
  } catch (err) {
    console.error('[FbToken] Error leyendo token:', err.message);
    return process.env.FACEBOOK_PAGE_TOKEN || null;
  }
}

/**
 * Valida que un token sea funcional con la API de Facebook.
 * @returns {boolean}
 */
export async function validateFbToken(token) {
  try {
    const appToken = `${FB_APP_ID}|${FB_APP_SECRET}`;
    const res = await fetch(
      `https://graph.facebook.com/v22.0/debug_token?input_token=${token}&access_token=${appToken}`
    );
    const data = await res.json();
    return data?.data?.is_valid === true;
  } catch {
    return false;
  }
}

/**
 * Intenta renovar el Page Token.
 * Flujo: usa el long-lived user_token almacenado para obtener un nuevo page token.
 * Si no hay user_token, usa el App Token para extender el page token actual.
 * 
 * @param {string} currentToken  Token de página actual
 * @param {string|null} userToken Long-lived user token almacenado (opcional)
 * @param {object} admin  Cliente Supabase admin
 * @returns {string|null} Nuevo token o null si falla
 */
async function refreshPageToken(currentToken, userToken, admin) {
  try {
    let newPageToken = null;

    // Estrategia A: Si tenemos long-lived user token, obtener nuevo page token
    if (userToken) {
      const res = await fetch(
        `https://graph.facebook.com/v22.0/${FB_PAGE_ID}?fields=access_token&access_token=${userToken}`
      );
      const data = await res.json();
      if (data.access_token && !data.error) {
        newPageToken = data.access_token;
        console.log('[FbToken] ✅ Nuevo page token obtenido via user_token.');
      } else {
        console.warn('[FbToken] user_token inválido:', data.error?.message);
      }
    }

    // Estrategia B: Extender el page token actual con el App Secret
    if (!newPageToken) {
      const res = await fetch(
        `https://graph.facebook.com/v22.0/oauth/access_token` +
        `?grant_type=fb_exchange_token` +
        `&client_id=${FB_APP_ID}` +
        `&client_secret=${FB_APP_SECRET}` +
        `&fb_exchange_token=${currentToken}`
      );
      const data = await res.json();
      if (data.access_token && !data.error) {
        newPageToken = data.access_token;
        const expiresIn = data.expires_in || 5184000; // default 60 días
        console.log(`[FbToken] ✅ Token extendido via app secret. Expira en ${Math.floor(expiresIn / 86400)} días.`);
      } else {
        console.warn('[FbToken] Extensión via app secret falló:', data.error?.message);
        return null;
      }
    }

    // Guardar el nuevo token en Supabase
    const expiresAt = new Date(Date.now() + 59 * 24 * 60 * 60 * 1000); // ~59 días
    await admin
      .from('social_tokens')
      .update({
        token:      newPageToken,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
        notes:      `Auto-renovado el ${new Date().toLocaleDateString('es-DO')}`,
      })
      .eq('id', 'facebook_page');

    console.log('[FbToken] ✅ Token guardado en Supabase. Expira:', expiresAt.toLocaleDateString('es-DO'));
    return newPageToken;

  } catch (err) {
    console.error('[FbToken] Error en refreshPageToken:', err.message);
    return null;
  }
}

/**
 * Guarda manualmente un nuevo token desde el panel admin.
 * Llamado por POST /api/admin/refresh-fb-token
 */
export async function saveNewFbToken(pageToken, userToken = null) {
  const admin = getAdmin();
  const expiresAt = new Date(Date.now() + 59 * 24 * 60 * 60 * 1000);

  const { error } = await admin
    .from('social_tokens')
    .upsert({
      id:         'facebook_page',
      token:      pageToken,
      token_type: 'page',
      expires_at: expiresAt.toISOString(),
      user_token: userToken,
      platform:   'facebook',
      updated_at: new Date().toISOString(),
      notes:      `Guardado manualmente el ${new Date().toLocaleDateString('es-DO')}`,
    }, { onConflict: 'id' });

  if (error) throw error;
  return expiresAt;
}

/**
 * Lee el estado del token para mostrarlo en el panel admin.
 */
export async function getFbTokenStatus() {
  try {
    const admin = getAdmin();
    const { data } = await admin
      .from('social_tokens')
      .select('expires_at, updated_at, notes')
      .eq('id', 'facebook_page')
      .single();

    if (!data) return { valid: false, daysLeft: 0, source: 'none' };

    const daysLeft = data.expires_at
      ? Math.max(0, Math.floor((new Date(data.expires_at) - Date.now()) / 86400000))
      : 999; // sin expiración

    return {
      valid:     daysLeft > 0,
      daysLeft,
      expiresAt: data.expires_at,
      updatedAt: data.updated_at,
      notes:     data.notes,
      source:    'supabase',
    };
  } catch {
    return { valid: !!process.env.FACEBOOK_PAGE_TOKEN, daysLeft: 0, source: 'env' };
  }
}
