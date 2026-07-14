/**
 * /api/cron/self-heal — Auto-sanación editorial (último recurso nocturno)
 * ─────────────────────────────────────────────────────────────────────────
 * Se ejecuta a las 7 PM RD (23:00 UTC).
 * Detecta qué secciones no tienen artículo HOY y dispara el bot
 * internamente para completar la cuota. Es el respaldo final de la jornada.
 *
 * Lógica:
 *  1. Consulta Supabase → total de artículos publicados hoy
 *  2. Si ya se alcanzó el límite global → sin acción
 *  3. Para cada sección de alta prioridad vacía → llama a /api/cron/bot?category=X
 *  4. Reporta resultado por Telegram
 *
 * Programado: 0 23 * * *  (23:00 UTC = 7:00 PM RD, todos los días)
 * El bot corre a las 10 AM, 1 PM y 4 PM RD → self-heal cubre lo que falte a las 7 PM.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse }  from 'next/server';

export const maxDuration = 55;
export const dynamic     = 'force-dynamic';

// Secciones prioritarias para el self-heal nocturno.
// El self-heal cubre hasta DAILY_LIMIT_GLOBAL artículos faltantes.
// Orden de prioridad: secciones de mayor tráfico e impacto editorial.
const REQUIRED_SECTIONS = [
  'politica', 'deportes', 'sucesos', 'economia', 'internacional',
  'policia', 'salud', 'tecnologia', 'entretenimiento', 'cultura',
];

// Límite diario global — coherente con el bot principal
const DAILY_LIMIT_GLOBAL = 3;

const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.imperiopublico.com';
const CRON_SECRET = process.env.CRON_SECRET;

async function sendTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch (_) {}
}

export async function GET(req) {
  const authHeader   = req.headers.get('authorization');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const isAuthorized = isVercelCron || authHeader === `Bearer ${CRON_SECRET}`;
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Día actual en RD
  const todayDR    = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const startOfDay = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
  const endOfDay   = new Date(`${todayDR}T23:59:59-04:00`).toISOString();

  // Total de artículos publicados hoy (límite global)
  const { count: totalToday } = await admin
    .from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay);

  // Si ya se alcanzó el límite global, no hay nada que sanar
  if ((totalToday ?? 0) >= DAILY_LIMIT_GLOBAL) {
    await sendTelegram(
      `✅ <b>Imperio Público — Auto-Sanación</b>\n\n` +
      `📅 ${todayDR}\n` +
      `🎉 Límite diario alcanzado (${totalToday}/${DAILY_LIMIT_GLOBAL} artículos). ¡Sin acción necesaria!`
    );
    return NextResponse.json({ status: 'complete', totalToday, limit: DAILY_LIMIT_GLOBAL });
  }

  // Categorías ya publicadas hoy (para saber qué secciones faltan)
  const { data: published } = await admin
    .from('articles')
    .select('category')
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay);

  // Secciones ya cubiertas hoy
  const covered = new Set((published || []).map(a => a.category));
  const missing = REQUIRED_SECTIONS.filter(s => !covered.has(s));

  // Cuántos artículos más podemos publicar respetando el límite global
  const canPublish = Math.max(0, DAILY_LIMIT_GLOBAL - (totalToday ?? 0));
  const toHeal = missing.slice(0, canPublish);
  const healResults = await Promise.allSettled(
    toHeal.map(async (section) => {
      const botUrl = `${SITE_URL}/api/cron/bot?category=${section}`;
      const ctrl   = new AbortController();
      const timer  = setTimeout(() => ctrl.abort(), 50000);
      try {
        const res = await fetch(botUrl, {
          headers: {
            'Authorization': `Bearer ${CRON_SECRET}`,
            'x-vercel-cron': '1',
          },
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (res.ok) return { section, ok: true };
        return { section, ok: false, reason: `HTTP ${res.status}` };
      } catch (e) {
        clearTimeout(timer);
        return { section, ok: false, reason: e.message.slice(0, 40) };
      }
    })
  );

  const healed = [];
  const failed = [];

  for (const result of healResults) {
    const val = result.value || { section: '?', ok: false, reason: result.reason?.message || 'rejected' };
    if (val.ok) healed.push(val.section);
    else         failed.push(`${val.section} (${val.reason})`);
  }

  const remaining = missing.slice(toHeal.length);

  // Reporte Telegram
  const healedTxt  = healed.length    ? `✅ Publicadas: ${healed.join(', ')}` : '';
  const failedTxt  = failed.length    ? `❌ Fallidas: ${failed.join(', ')}`   : '';
  const remainTxt  = remaining.length ? `⏳ Pendientes: ${remaining.join(', ')}` : '';
  const statusIcon = failed.length === 0 ? '🟢' : '🟡';

  await sendTelegram(
    `${statusIcon} <b>Imperio Público — Auto-Sanación (Mediodía)</b>\n\n` +
    `📅 ${todayDR}\n` +
    `📰 Artículos hoy: ${totalToday ?? 0}/${DAILY_LIMIT_GLOBAL}\n` +
    `🔧 Secciones procesadas: ${toHeal.join(', ') || 'ninguna'}\n\n` +
    [healedTxt, failedTxt, remainTxt].filter(Boolean).join('\n')
  );

  // ─── CLEANUP INTEGRADO (inline — endpoint /api/cron/cleanup eliminado) ────
  // Ejecutado como Promise asíncrona fire-and-forget para no bloquear la respuesta.
  Promise.resolve().then(async () => {
    try {
      const { count: totalCount } = await admin
        .from('articles')
        .select('*', { count: 'exact', head: true });

      if ((totalCount ?? 0) < 200) {
        console.log(`[Cleanup] Saltando: solo ${totalCount} artículos en DB (mínimo 200).`);
        return;
      }

      const oneEightyDaysAgo = new Date();
      oneEightyDaysAgo.setDate(oneEightyDaysAgo.getDate() - 180);

      const { count: deletedArticles } = await admin
        .from('articles')
        .delete({ count: 'exact' })
        .lt('publishedAt', oneEightyDaysAgo.toISOString())
        .eq('featured', false)
        .eq('trending', false)
        .or('image.is.null,image.eq.""')
        .limit(50);

      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

      const { count: deletedDrafts } = await admin
        .from('articles')
        .delete({ count: 'exact' })
        .is('publishedAt', null)
        .lt('created_at', oneMonthAgo.toISOString());

      console.log(`[Cleanup] Completado: ${deletedArticles || 0} artículos viejos, ${deletedDrafts || 0} borradores eliminados.`);
    } catch (e) {
      console.warn('[Self-heal] Cleanup inline falló:', e.message);
    }
  });

  return NextResponse.json({
    status: failed.length === 0 ? 'healed' : 'partial',
    date: todayDR,
    totalToday,
    limit: DAILY_LIMIT_GLOBAL,
    healed,
    failed,
    remaining,
  });
}
