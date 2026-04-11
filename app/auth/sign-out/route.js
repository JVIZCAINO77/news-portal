// app/auth/sign-out/route.js — Logout Handler for Imperio Público 2.0
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createClient();

  // Refrescar sesión y obtener usuario
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    await supabase.auth.signOut();
  }

  const revalidateUrl = new URL('/admin/login', request.url);
  return NextResponse.redirect(revalidateUrl, {
    status: 302,
  });
}
