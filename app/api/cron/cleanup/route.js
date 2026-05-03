
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

/**
 * API de Mantenimiento Automático para Imperio Público.
 * Objetivo: Mantener la base de datos esbelta y rápida.
 * Se recomienda ejecutar esto 1 vez al mes.
 */
export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const CRON_SECRET = process.env.CRON_SECRET;

  // Protección de seguridad
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
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

    // 1. Limpieza de artículos "relleno" antiguos
    // Borramos artículos de más de 180 días que NO sean destacados ni tendencia
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
    
    const { count: deletedArticles, error: err1 } = await supabase
      .from('articles')
      .delete({ count: 'exact' })
      .lt('publishedAt', sixMonthsAgo.toISOString())
      .eq('featured', false)
      .eq('trending', false);

    if (!err1) report.articlesDeleted = deletedArticles || 0;

    // 2. Limpieza de borradores huérfanos o muy antiguos (> 30 días)
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
