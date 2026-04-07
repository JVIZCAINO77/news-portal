// app/admin/actions.js — Gestión de Configuración Global (PulsoNoticias 2.0)
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleAutomation(enable) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No autorizado');
  }

  // 1. Verificar si el usuario es Admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Solo los administradores pueden cambiar la configuración global.');
  }

  // 2. Actualizar tabla settings
  const { error } = await supabase
    .from('settings')
    .update({
      value: enable, // boolean
      updated_at: new Date().toISOString()
    })
    .eq('key', 'automation_enabled');

  if (error) {
    throw new Error(`Error al actualizar configuración: ${error.message}`);
  }

  revalidatePath('/admin');
  return { success: true };
}
