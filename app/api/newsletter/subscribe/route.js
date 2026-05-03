// app/api/newsletter/subscribe/route.js
// Guarda suscriptores de newsletter en Supabase
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Upsert — si ya existe el email, actualiza la fecha de re-suscripción
    const { error } = await supabase
      .from('newsletter_subscribers')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          subscribed_at: new Date().toISOString(),
          active: true,
        },
        { onConflict: 'email' }
      );

    if (error) {
      console.error('[Newsletter] Error guardando suscriptor:', error.message);
      return NextResponse.json({ error: 'Error al procesar suscripción' }, { status: 500 });
    }

    console.log(`[Newsletter] Nuevo suscriptor: ${email}`);
    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[Newsletter] Error:', err.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
