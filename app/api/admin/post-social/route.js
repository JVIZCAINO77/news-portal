/**
 * app/api/admin/post-social/route.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Endpoint protegido para publicar manualmente un artículo en redes sociales
 * desde el panel administrativo.
 *
 * POST /api/admin/post-social
 * Body: { articleId: string }
 * Auth: requiere sesión de admin en Supabase
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin'; // Fix C2 completado
import { postToSocialMedia } from '@/lib/social';

export async function POST(request) {
  try {
    // 1. Verificar autenticación
    const supabase = await createServerClient();
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Verificar rol admin
    const admin = getAdminClient(); // Fix C2
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return Response.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    // 3. Leer el artículo desde el body
    const { articleId } = await request.json();
    if (!articleId) {
      return Response.json({ error: 'articleId requerido' }, { status: 400 });
    }

    // 4. Obtener el artículo completo
    const { data: article, error: artError } = await admin
      .from('articles')
      .select('id, title, slug, excerpt, category, image, social_posted_at')
      .eq('id', articleId)
      .single();

    if (artError || !article) {
      return Response.json({ error: 'Artículo no encontrado' }, { status: 404 });
    }

    // Fix M7: Rate-limit — previene spam publicando el mismo artículo múltiples veces
    // Mínimo 2 horas entre publicaciones del mismo artículo
    if (article.social_posted_at) {
      const lastPosted = new Date(article.social_posted_at);
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      if (lastPosted > twoHoursAgo) {
        const minutesLeft = Math.ceil((lastPosted - twoHoursAgo) / 60000);
        return Response.json({
          error: `Este artículo ya fue publicado recientemente. Espera ${minutesLeft} minutos más.`
        }, { status: 429 });
      }
    }

    // 5. Publicar en redes sociales
    console.log(`[Admin Social] Publicando manualmente: "${article.title?.slice(0, 60)}"`);
    await postToSocialMedia(article);

    // Registrar timestamp de publicación social (para rate-limit)
    await admin.from('articles')
      .update({ social_posted_at: new Date().toISOString() })
      .eq('id', articleId);

    return Response.json({
      ok: true,
      message: `"${article.title?.slice(0, 60)}" publicado en redes sociales.`,
    });

  } catch (err) {
    console.error('[Admin Social] Error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
