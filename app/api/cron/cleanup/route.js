
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Fix M4: previene que el cleanup sea cortado por Vercel

/**
 * API de Mantenimiento Automático para Imperio Público.
 * Objetivo: Mantener la base de datos esbelta y rápida.
 * Se ejecuta automáticamente cada 2 horas via selfcheck.yml.
 * También puede llamarse manualmente desde maintenance.yml.
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
