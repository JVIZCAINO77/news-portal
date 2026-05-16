/**
 * app/api/admin/repair-proxy/route.js
 *
 * Proxy server-side para ImageRepairButton.
 * Mantiene CRON_SECRET FUERA del cliente — el secreto nunca llega al navegador.
 * Requiere sesión de admin autenticada en Supabase.
 */
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

export async function GET(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action'); // 'scan'

  const secret = process.env.CRON_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.imperiopublico.com';

  const res = await fetch(`${baseUrl}/api/admin/repair-images?secret=${secret}`, {
    method: 'GET',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const secret = process.env.CRON_SECRET;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.imperiopublico.com';

  const res = await fetch(`${baseUrl}/api/admin/repair-images?secret=${secret}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
