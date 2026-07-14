// app/api/admin/articles/route.js — CRUD de Artículos (Service Role, sin RLS)
// POST → crear artículo | PATCH → actualizar artículo
// Usa SERVICE_ROLE_KEY para bypassar RLS completamente.
// Autenticación verificada via cookie de sesión Supabase antes de operar.

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Verifica sesión activa y devuelve el user, o null si no autenticado */
async function getAuthUser(cookieStore) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // read-only en Route Handlers
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Cliente admin (service role) — omite RLS completamente */
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/** Genera slug desde título */
function makeSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// ── GET /api/admin/articles?trigger=bot&category=X → Disparo manual del bot ──
// Reemplaza el endpoint eliminado /api/cron/trigger para cumplir límite de 12 funciones Hobby.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const trigger = searchParams.get('trigger');

  if (trigger !== 'bot') {
    return NextResponse.json({ error: 'Parámetro trigger inválido' }, { status: 400 });
  }

  try {
    const cookieStore = await cookies();
    const user = await getAuthUser(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verificar rol admin
    const admin = getAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Solo los administradores pueden disparar el bot.' }, { status: 403 });
    }

    const category = searchParams.get('category') || 'politica';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${request.headers.get('host')}`;
    const secret  = process.env.CRON_SECRET;

    const botRes = await fetch(`${baseUrl}/api/cron/bot?category=${encodeURIComponent(category)}`, {
      headers: {
        'Authorization': `Bearer ${secret}`,
        'x-vercel-cron': '1',
      },
    });

    const result = await botRes.json().catch(() => ({}));
    return NextResponse.json({ triggered: true, category, result, status: botRes.status });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── POST /api/admin/articles → Crear artículo ────────────────────────────────
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const user = await getAuthUser(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { title, excerpt, content, category, image, author, tags, sourceLink, featured, trending } = body;

    if (!title || !excerpt || !content) {
      return NextResponse.json({ error: 'Faltan campos requeridos: title, excerpt, content' }, { status: 400 });
    }

    const slug = makeSlug(title);
    const supabase = getAdminClient();

    // Verificar duplicado de slug
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'duplicate_slug', message: 'Ya existe una noticia con este título.' }, { status: 409 });
    }

    // Obtener nombre del perfil si no se envió autor
    let authorName = author;
    if (!authorName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      authorName = profile?.full_name || user.email?.split('@')[0] || 'Redacción';
    }

    const newArticle = {
      title,
      slug,
      excerpt,
      content,
      category: category || 'noticias',
      image: image || 'https://images.unsplash.com/photo-1504711331083-9c897949ff59?auto=format&fit=crop&w=1200&h=630&q=80',
      author: authorName,
      author_id: user.id,
      tags: Array.isArray(tags) ? tags : null,
      source_link: sourceLink?.trim() || null,
      publishedAt: new Date().toISOString(),
      featured: !!featured,
      trending: !!trending,
    };

    const { data, error } = await supabase
      .from('articles')
      .insert(newArticle)
      .select('id, slug')
      .single();

    if (error) {
      console.error('[POST /api/admin/articles]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/admin/articulos');
    revalidatePath('/');

    return NextResponse.json({ success: true, id: data.id, slug: data.slug }, { status: 201 });

  } catch (err) {
    console.error('[POST /api/admin/articles] Unhandled:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// ── PATCH /api/admin/articles → Actualizar artículo ──────────────────────────
export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const user = await getAuthUser(cookieStore);
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, excerpt, content, category, image, author, tags, sourceLink, featured, trending } = body;

    if (!id) {
      return NextResponse.json({ error: 'Falta el ID del artículo' }, { status: 400 });
    }

    const slug = makeSlug(title);
    const supabase = getAdminClient();

    // Verificar duplicado (excluyendo el artículo actual)
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'duplicate_slug', message: 'Ya existe OTRA noticia con este título.' }, { status: 409 });
    }

    const { error } = await supabase
      .from('articles')
      .update({
        title,
        slug,
        excerpt,
        content,
        category,
        image,
        author,
        tags: Array.isArray(tags) ? tags : null,
        source_link: sourceLink?.trim() || null,
        featured: !!featured,
        trending: !!trending,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('[PATCH /api/admin/articles]', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePath('/admin/articulos');
    revalidatePath('/admin');
    revalidatePath('/');

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error('[PATCH /api/admin/articles] Unhandled:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
