// app/admin/actions.js — Gestión de Configuración Global (Imperio Público 2.0)
'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function toggleAutomation(enable) {
  // Verificar auth del usuario
  const supabaseAuth = await createServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) {
    throw new Error('No autorizado');
  }

  // Verificar que sea admin
  const { data: profile } = await supabaseAuth
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Solo los administradores pueden cambiar la configuración global.');
  }

  // Usar service role para evitar bloqueos RLS en settings
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Upsert garantiza que la fila existe aunque la tabla esté vacía
  const { error } = await supabase
    .from('settings')
    .upsert(
      {
        key: 'automation_enabled',
        value: enable,          // boolean nativo — Supabase lo convierte a JSONB
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }     // actualiza si ya existe
    );

  if (error) {
    throw new Error(`Error al actualizar configuración: ${error.message}`);
  }

  revalidatePath('/admin');
  return { success: true };
}
