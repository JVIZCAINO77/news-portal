/**
 * /api/cron/self-heal — Auto-sanación editorial
 * ─────────────────────────────────────────────────────────────────
 * Se ejecuta a las 12 PM (hora RD / 4 PM UTC).
 * Detecta qué secciones no tienen artículo HOY y dispara el bot
 * internamente para cada una. Garantía de cobertura total diaria.
 *
 * Lógica:
 *  1. Consulta Supabase → ¿qué secciones ya tienen artículo hoy?
 *  2. Para cada sección vacía → llama a /api/cron/bot?category=X
 *  3. Reporta resultado por Telegram
 *
 * Programado: 0 16 * * *  (4 PM UTC = 12 PM RD, todos los días)
 * El cron del bot corre a las 8 AM RD → self-heal completa las 2-3 restantes al mediodía.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse }  from 'next/server';

export const maxDuration = 55;
export const dynamic     = 'force-dynamic';

// Secciones que DEBEN tener artículo cada día (meta: 3 artículos/día)
// El self-heal cubre hasta DAILY_LIMIT_GLOBAL secciones en paralelo.
// Prioridad: las secciones de mayor tráfico e impacto editorial.
const REQUIRED_SECTIONS = [
  'politica', 'deportes', 'internacional', 'sucesos', 'economia',
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
      const timer  = setTimeout(() => ctrl.abort(), 30000);
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

  // ─── CLEANUP INTEGRADO ───────────────────────────────────────────────────
  // Se lanza como fire-and-forget junto con la auto-sanación del mediodía.
  fetch(`${SITE_URL}/api/cron/cleanup`, {
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'x-vercel-cron': '1',
    },
  }).catch(e => console.warn('[Self-heal] Cleanup fire-and-forget falló:', e.message));

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
