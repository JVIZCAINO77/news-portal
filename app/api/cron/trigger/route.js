// app/api/cron/trigger/route.js — Disparo Manual del Bot (Solo Admin)
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_CATEGORIES = [
  'noticias', 'politica', 'economia', 'internacional',
  'deportes', 'sucesos', 'salud', 'entretenimiento',
  'cultura', 'tecnologia', 'tendencias', 'opinion',
];

export async function POST(request) {
  // 1. Verificar que el usuario está autenticado y es admin
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden disparar el bot.' }, { status: 403 });
  }

  // 2. Obtener categoría del cuerpo de la petición
  const body = await request.json().catch(() => ({}));
  const category = body.category || 'noticias';

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: `Categoría inválida: ${category}` }, { status: 400 });
  }

  // 3. Llamar internamente al endpoint del bot
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  `https://${request.headers.get('host')}`;
  
  const botUrl = `${baseUrl}/api/cron/bot?category=${category}`;

  try {
    const botResponse = await fetch(botUrl, {
      method: 'GET',
      headers: {
        // Omitir el CRON_SECRET ya que estamos disparando manualmente como admin
        'X-Manual-Trigger': 'true',
        'X-Admin-Id': user.id,
      },
    });

    const result = await botResponse.json();

    return NextResponse.json({
      triggered: true,
      category,
      result,
      status: botResponse.status,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
