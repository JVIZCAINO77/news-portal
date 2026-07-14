/**
 * app/api/admin/repair-proxy/route.js
 *
 * Proxy/executor de reparación de imágenes — Imperio Público.
 * Absorbe la lógica de /api/admin/repair-images (eliminado para reducir función count a ≤12 Hobby).
 * Requiere sesión de admin autenticada en Supabase.
 *
 * GET  ?action=scan   → Estadísticas de imágenes rotas
 * POST ?action=repair → Ejecuta reparación en lote (limit en body)
 */
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ── Auth ──────────────────────────────────────────────────────────────────────
async function verifyAdmin() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

// ── Helpers de reparación ─────────────────────────────────────────────────────
const BLOCKED_DOMAINS = new Set([
  'diariolibre.com', 'listindiario.com', 'eldinero.com.do',
  'elcaribe.com.do', 'acento.com.do', 'elnacional.com.do',
  'hoy.com.do', 'eldia.com.do', 'cdn.com.do', 'noticiassin.com',
]);

function isBlockedDomain(url) {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return BLOCKED_DOMAINS.has(hostname) || [...BLOCKED_DOMAINS].some(d => hostname.endsWith(d));
  } catch { return false; }
}

function needsRepair(imageUrl) {
  if (!imageUrl) return true;
  if (imageUrl.includes('cloudinary.com')) return false;
  if (imageUrl.includes('unsplash.com')) return false;
  return true;
}

async function uploadToCloudinary(url, cloudName, uploadPreset) {
  if (!url || !cloudName || !uploadPreset) return null;
  let safeUrl = url;
  if (safeUrl.startsWith('//')) safeUrl = `https:${safeUrl}`;
  if (safeUrl.startsWith('http://')) safeUrl = safeUrl.replace('http://', 'https://');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  try {
    const formData = new FormData();
    formData.append('file', safeUrl);
    formData.append('upload_preset', uploadPreset);
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData, signal: controller.signal }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    return data.secure_url || null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}

async function generateAiImage(title, category, cloudName, uploadPreset) {
  const prompt = `high-end editorial news photography for an article titled "${title}". Category: ${category}. Professional journalistic style, cinematic lighting, 16:9 aspect ratio. NO TEXT, NO LETTERS.`;
  const aiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true&seed=${Date.now()}`;
  return await uploadToCloudinary(aiUrl, cloudName, uploadPreset) || aiUrl;
}

// ── GET → Escanear imágenes ───────────────────────────────────────────────────
export async function GET(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, image, category')
    .order('publishedAt', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const broken = (articles || []).filter(a => needsRepair(a.image));
  const cloudinary = (articles || []).filter(a => a.image?.includes('cloudinary.com'));
  const total = articles?.length || 0;

  return NextResponse.json({
    summary: {
      total,
      cloudinary: cloudinary.length,
      broken: broken.length,
      percentageSafe: total > 0 ? Math.round((cloudinary.length / total) * 100) : 0,
    },
    broken: broken.map(a => ({ id: a.id, title: a.title?.slice(0, 60), image: a.image?.slice(0, 80) })),
  });
}

// ── POST → Reparar imágenes ───────────────────────────────────────────────────
export async function POST(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { limit = 10 } = await request.json().catch(() => ({}));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const cloudName    = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '').toLowerCase();
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    return NextResponse.json({ error: 'Variables de Cloudinary no configuradas' }, { status: 500 });
  }

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, image, category')
    .order('publishedAt', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const toRepair = (articles || []).filter(a => needsRepair(a.image)).slice(0, limit);
  const results  = { repaired: 0, ai_generated: 0, failed: 0, details: [] };

  for (const article of toRepair) {
    let newImageUrl = null;
    let method = 'unknown';

    if (article.image && !isBlockedDomain(article.image)) {
      newImageUrl = await uploadToCloudinary(article.image, cloudName, uploadPreset);
      if (newImageUrl) method = 'cloudinary_upload';
    }

    if (!newImageUrl) {
      newImageUrl = await generateAiImage(article.title, article.category, cloudName, uploadPreset);
      method = newImageUrl?.includes('cloudinary.com') ? 'ai_cloudinary' : 'ai_pollinations';
    }

    if (!newImageUrl) {
      results.failed++;
      results.details.push({ id: article.id, title: article.title?.slice(0, 50), status: 'failed' });
      continue;
    }

    const { error: updateError } = await supabase
      .from('articles')
      .update({ image: newImageUrl, updated_at: new Date().toISOString() })
      .eq('id', article.id);

    if (updateError) {
      results.failed++;
      results.details.push({ id: article.id, status: 'db_error', error: updateError.message });
    } else {
      if (method.startsWith('ai')) results.ai_generated++;
      else results.repaired++;
      results.details.push({ id: article.id, title: article.title?.slice(0, 50), status: 'ok', method });
    }
  }

  return NextResponse.json({
    success: true,
    message: `Procesados ${toRepair.length} artículos. ${results.repaired} reparados, ${results.ai_generated} con imagen IA, ${results.failed} fallidos.`,
    results,
    remaining: (articles || []).filter(a => needsRepair(a.image)).length - toRepair.length,
  });
}
