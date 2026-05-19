// app/api/articles/view/route.js — Contador de vistas ultra-optimizado
// OPTIMIZACIÓN: Edge Runtime + cliente Supabase singleton por worker
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Edge Runtime: más ligero y rápido que Node.js serverless para operaciones simples
export const runtime = 'edge';

// Singleton del cliente Supabase — se reutiliza entre requests del mismo worker Edge.
// Evita reconectar en cada petición de vista (era el mayor gasto de CPU de este endpoint).
let _supabase = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false } } // Sin sesión — más ligero
    );
  }
  return _supabase;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    const slug = body?.slug;

    if (!slug || typeof slug !== 'string' || slug.length > 200) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const supabase = getSupabase();

    // Incremento atómico via RPC — 1 sola query, sin leer el valor actual primero
    const { error } = await supabase.rpc('increment_views', { article_slug: slug });

    if (error) {
      // Fallback silencioso: update directo
      await supabase
        .from('articles')
        .update({ views: supabase.sql`COALESCE(views, 0) + 1` })
        .eq('slug', slug)
        .catch(() => {}); // Silencioso — vistas nunca bloquean UX
    }

    // Sin body innecesario — respuesta mínima para reducir ancho de banda
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 }); // Silencioso siempre
  }
}
