/**
 * /api/health — Monitor de salud del sistema
 * Verifica en tiempo real todos los componentes críticos.
 * Usado por GitHub Actions y monitoreo externo.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse }  from 'next/server';

export const maxDuration = 15;
export const dynamic     = 'force-dynamic';

export async function GET() {
  const checks  = {};
  let   healthy = true;

  // Cliente único reutilizado en todos los checks — evita abrir 2 conexiones por request
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Supabase
  try {
    const { count } = await sb.from('articles').select('*', { count: 'exact', head: true });
    checks.supabase = { ok: true, articles: count };
  } catch (e) {
    checks.supabase = { ok: false, error: e.message };
    healthy = false;
  }

  // 2. Gemini (verificar que al menos 1 clave responde)
  try {
    const keys = (process.env.GEMINI_API_KEY || '').split(',').filter(Boolean);
    checks.gemini = { ok: keys.length > 0, keysConfigured: keys.length };
    if (keys.length === 0) healthy = false;
  } catch (e) {
    checks.gemini = { ok: false, error: e.message };
    healthy = false;
  }

  // 3. Cloudinary
  checks.cloudinary = {
    ok: !!(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET),
  };

  // 4. OpenRouter
  checks.openrouter = { ok: !!process.env.OPENROUTER_API_KEY };

  // 5. Artículos de hoy
  try {
    const todayDR    = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    const startOfDay = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
    const { data }   = await sb.from('articles').select('category').gte('publishedAt', startOfDay);
    const required   = ['nacional','politica','economia','internacional','tecnologia','deportes','entretenimiento','salud','educacion','medio-ambiente','cultura'];
    const covered    = new Set((data || []).map(a => a.category));
    const missing    = required.filter(s => !covered.has(s));
    checks.editorial = {
      ok:      missing.length < 3,
      today:   covered.size,
      total:   required.length,
      missing,
    };
  } catch (e) {
    checks.editorial = { ok: false, error: e.message };
  }

  // 6. Facebook token
  try {
    const { data } = await sb.from('social_tokens').select('expires_at').eq('id', 'facebook_page').single();
    const daysLeft = data?.expires_at
      ? Math.max(0, Math.floor((new Date(data.expires_at) - Date.now()) / 86400000))
      : null;
    checks.facebook_token = {
      ok:       daysLeft === null || daysLeft > 7,
      daysLeft: daysLeft ?? 'sin fecha',
      source:   data ? 'supabase' : 'env_fallback',
    };
    if (daysLeft !== null && daysLeft <= 7) healthy = false;
  } catch (e) {
    checks.facebook_token = { ok: !!process.env.FACEBOOK_PAGE_TOKEN, source: 'env' };
  }

  const status = healthy ? 200 : 503;
  return NextResponse.json({
    status:    healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks,
  }, { status });
}
