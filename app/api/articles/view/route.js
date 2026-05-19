// app/api/articles/view/route.js — Contador de vistas ultra-optimizado
// OPTIMIZACIÓN: Edge Runtime + cliente Supabase singleton por worker
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Edge Runtime: más ligero y rápido que Node.js serverless para operaciones simples
export const runtime = 'edge';

// Singleton del cliente Supabase — se reutiliza entre requests del mismo worker Edge.
// Evita reconectar en cada petición de vista.
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } }
    );
  }
  return _supabase;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const slug = body?.slug;

    if (!slug || typeof slug !== 'string' || slug.length > 200) {
      return new Response(null, { status: 204 });
    }

    const supabase = getSupabase();

    // Incremento atómico via RPC — 1 sola query sin leer el valor actual
    const { error } = await supabase.rpc('increment_views', { article_slug: slug });

    if (error) {
      // Fallback: leer el valor actual e incrementar manualmente
      const { data: cur } = await supabase
        .from('articles')
        .select('views')
        .eq('slug', slug)
        .maybeSingle();

      await supabase
        .from('articles')
        .update({ views: (cur?.views || 0) + 1 })
        .eq('slug', slug)
        .catch(() => {}); // Silencioso — vistas nunca bloquean UX
    }

    // Respuesta mínima 204 — el cliente no lee el body (fire & forget)
    return new Response(null, { status: 204 });
  } catch {
    // Silencioso siempre — las vistas nunca deben afectar la experiencia
    return new Response(null, { status: 204 });
  }
}
