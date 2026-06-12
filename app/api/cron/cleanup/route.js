
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime    = 'nodejs';
export const dynamic    = 'force-dynamic';
export const maxDuration = 30; // HAL-09: declarado aquí Y en vercel.json para garantía doble

/**
 * API de Mantenimiento Automático para Imperio Público.
 * Objetivo: Mantener la base de datos esbelta y rápida.
 * Llamada como fire-and-forget desde /api/cron/self-heal (01:00 UTC / 9 PM RD).
 * También puede invocarse manualmente desde el panel de administración.
 */
export async function GET(request) {
  // ── Guardia dual — igual que /api/cron/bot y /api/cron/self-heal ────────────
  // HAL-08 fix: la condición anterior (CRON_SECRET && ...) dejaba el endpoint
  // completamente abierto si CRON_SECRET no estaba definido en el entorno.
  // Ahora se requiere AL MENOS una de las dos vías de autorización.
  const CRON_SECRET   = process.env.CRON_SECRET;
  const isVercelCron  = request.headers.get('x-vercel-cron') === '1';
  const authHeader    = request.headers.get('authorization');
  const hasValidToken = !!CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`;

  if (!isVercelCron && !hasValidToken) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const report = {
      articlesDeleted: 0,
      oldDraftsDeleted: 0,
      timestamp: new Date().toISOString()
    };

    // Fix C3: loguear los artículos ANTES de borrarlos para auditoría
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Primero: identificar qué se va a borrar
    const { data: toDelete } = await supabase
      .from('articles')
      .select('id, title, publishedAt')
      .lt('publishedAt', ninetyDaysAgo.toISOString())
      .eq('featured', false)
      .eq('trending', false)
      .or('image.is.null,image.eq.""')  // Fix M8: incluir imagen vacía además de NULL
      .eq('views', 0)
      .limit(100); // Techo de seguridad: borrar máx 100 a la vez

    if (toDelete?.length) {
      console.log(`[Cleanup] 🗑️ Marcados para borrar (${toDelete.length}):`,
        toDelete.map(a => `[${a.id}] ${a.title?.slice(0, 50)} (${a.publishedAt?.slice(0,10)})`)
      );
    }

    const { count: deletedArticles, error: err1 } = await supabase
      .from('articles')
      .delete({ count: 'exact' })
      .lt('publishedAt', ninetyDaysAgo.toISOString())
      .eq('featured', false)
      .eq('trending', false)
      .or('image.is.null,image.eq.""')  // Fix M8
      .eq('views', 0)
      .limit(100);

    if (!err1) report.articlesDeleted = deletedArticles || 0;

    // 2. Limpieza de borradores huérfanos o muy antiguos (>30 días sin publicar)
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const { count: deletedDrafts, error: err2 } = await supabase
      .from('articles')
      .delete({ count: 'exact' })
      .is('publishedAt', null)
      .lt('created_at', oneMonthAgo.toISOString());
    
    if (!err2) report.oldDraftsDeleted = deletedDrafts || 0;

    console.log(`[Maintenance] Cleanup finished:`, report);

    return NextResponse.json({
      success: true,
      message: 'Mantenimiento completado con éxito',
      report
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
