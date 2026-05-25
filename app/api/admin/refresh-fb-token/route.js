/**
 * app/api/admin/refresh-fb-token/route.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint para renovar el Facebook Page Token desde el panel admin.
 *
 * GET  → Devuelve el estado actual del token (días restantes, fuente)
 * POST → Guarda un nuevo token pegado manualmente, o intenta auto-refresh
 *
 * Auth: requiere sesión admin
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getFbTokenStatus, saveNewFbToken, validateFbToken } from '@/lib/fbToken';

// ── GET: Estado del token ────────────────────────────────────────────────────
export async function GET(request) {
  try {
    const supabase = await createServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', authData.user.id).single();
    if (profile?.role !== 'admin') return Response.json({ error: 'Permisos insuficientes' }, { status: 403 });

    const status = await getFbTokenStatus();
    return Response.json({ ok: true, ...status });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── POST: Guardar nuevo token ────────────────────────────────────────────────
export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return Response.json({ error: 'No autorizado' }, { status: 401 });

    const admin = getAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', authData.user.id).single();
    if (profile?.role !== 'admin') return Response.json({ error: 'Permisos insuficientes' }, { status: 403 });

    const { pageToken, userToken } = await request.json();

    if (!pageToken) {
      return Response.json({ error: 'pageToken es requerido' }, { status: 400 });
    }

    // Validar que el token funciona antes de guardarlo
    const isValid = await validateFbToken(pageToken);
    if (!isValid) {
      return Response.json({
        error: 'El token proporcionado no es válido o está expirado. Verifica que sea un Page Access Token activo.'
      }, { status: 400 });
    }

    const expiresAt = await saveNewFbToken(pageToken, userToken || null);

    return Response.json({
      ok: true,
      message: `✅ Token actualizado correctamente. Válido hasta ~${expiresAt.toLocaleDateString('es-DO')}.`,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (err) {
    console.error('[RefreshToken] Error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
