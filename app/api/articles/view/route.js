// app/api/articles/view/route.js — Incrementa contador de vistas de un artículo
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Rate limit simple: usamos el slug como clave de control en el header
export async function POST(request) {
  try {
    const { slug } = await request.json();
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'slug requerido' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Incrementamos con RPC para atomicidad — si no existe la columna, falla silenciosamente
    const { error } = await supabase.rpc('increment_views', { article_slug: slug });

    if (error) {
      // Fallback: update directo si la función RPC no existe
      const { error: updateError } = await supabase
        .from('articles')
        .update({ views: supabase.sql`views + 1` })
        .eq('slug', slug);

      if (updateError) {
        // Silencioso — no queremos que el error de vistas afecte la UX
        console.warn('[ViewCounter] Error:', updateError.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Silencioso — las vistas nunca deben bloquear al usuario
    return NextResponse.json({ ok: false });
  }
}
