/**
 * /api/cron/self-heal — Auto-sanación editorial
 * ─────────────────────────────────────────────────────────────────
 * Se ejecuta a las 9 PM (hora RD / 1 AM UTC del día siguiente).
 * Detecta qué secciones no tienen artículo HOY y dispara el bot
 * internamente para cada una. Garantía de cobertura total diaria.
 *
 * Lógica:
 *  1. Consulta Supabase → ¿qué secciones ya tienen artículo hoy?
 *  2. Para cada sección vacía → llama a /api/cron/bot?category=X
 *  3. Reporta resultado por Telegram
 *
 * Programado: 0 1 * * *  (1 AM UTC = 9 PM RD, todos los días)
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse }  from 'next/server';

export const maxDuration = 55;
export const dynamic     = 'force-dynamic';

// Secciones que DEBEN tener artículo cada día (meta: 3 artículos/día)
// Prioridad: las 3 secciones de mayor tráfico del portal
const REQUIRED_SECTIONS = [
  'politica', 'deportes', 'internacional',
];

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

  // Secciones ya cubiertas hoy
  const { data: published } = await admin
    .from('articles')
    .select('category')
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay);

  const covered = new Set((published || []).map(a => a.category));
  const missing = REQUIRED_SECTIONS.filter(s => !covered.has(s));

  const report = {
    date:    todayDR,
    covered: [...covered].filter(c => REQUIRED_SECTIONS.includes(c)),
    missing,
    healed:  [],
    failed:  [],
  };

  if (missing.length === 0) {
    await sendTelegram(
      `✅ <b>Imperio Público — Auto-Sanación</b>\n\n` +
      `📅 ${todayDR}\n` +
      `🎉 Las 3 secciones prioritarias cubiertas. ¡Sistema perfecto!`
    );
    return NextResponse.json({ status: 'complete', ...report });
  }

  // Disparar bot para cada sección faltante EN PARALELO (Promise.allSettled)
  // Máximo 3 secciones en paralelo — alineado con la meta de 3 artículos/día.
  // 3 llamadas en paralelo de 20s caben perfectamente en la ventana de 55s de Vercel.
  const toHeal = missing.slice(0, 3);
  const healResults = await Promise.allSettled(
    toHeal.map(async (section) => {
      const botUrl = `${SITE_URL}/api/cron/bot?category=${section}`;
      const ctrl   = new AbortController();
      const timer  = setTimeout(() => ctrl.abort(), 30000); // 30s por sección — reduce falsos negativos en el reporte
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

  for (const result of healResults) {
    const val = result.value || { section: '?', ok: false, reason: result.reason?.message || 'rejected' };
    if (val.ok) {
      report.healed.push(val.section);
    } else {
      report.failed.push(`${val.section} (${val.reason})`);
    }
  }

  // Si quedan más, marcar para que el cron siguiente las cubra
  const remaining = missing.slice(toHeal.length); // antes era .slice(3) — bug: toHeal puede ser hasta 5
  if (remaining.length > 0) {
    report.remaining = remaining;
  }

  // Reporte Telegram
  const healedTxt  = report.healed.length  ? `✅ Reparadas: ${report.healed.join(', ')}` : '';
  const failedTxt  = report.failed.length  ? `❌ Fallidas: ${report.failed.join(', ')}`  : '';
  const remainTxt  = remaining.length       ? `⏳ Pendientes: ${remaining.join(', ')}`    : '';
  const statusIcon = report.failed.length === 0 ? '🟢' : '🟡';

  await sendTelegram(
    `${statusIcon} <b>Imperio Público — Auto-Sanación</b>\n\n` +
    `📅 ${todayDR}\n` +
    `📋 Secciones cubiertas: ${report.covered.length}/${REQUIRED_SECTIONS.length}\n` +
    `🔧 Faltaban: ${missing.join(', ')}\n\n` +
    [healedTxt, failedTxt, remainTxt].filter(Boolean).join('\n')
  );

  // ─── CLEANUP INTEGRADO (HAL-10) ───────────────────────────────────────────
  // El cron de cleanup fue eliminado del plan Hobby (límite = 2 crons).
  // Se lanza aquí como fire-and-forget: no bloquea la respuesta del self-heal.
  // Se ejecuta cada noche junto con la auto-sanación (1 AM UTC / 9 PM RD).
  fetch(`${SITE_URL}/api/cron/cleanup`, {
    headers: {
      'Authorization': `Bearer ${CRON_SECRET}`,
      'x-vercel-cron': '1',
    },
  }).catch(e => console.warn('[Self-heal] Cleanup fire-and-forget falló:', e.message));

  return NextResponse.json({
    status: report.failed.length === 0 ? 'healed' : 'partial',
    ...report,
  });
}
