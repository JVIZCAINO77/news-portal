// app/admin/articulos/actions.js — Gestión de Artículos (PulsoNoticias 2.0)
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Borrar un artículo de la base de datos
 * @param {string} id - El ID del artículo
 */
export async function deleteArticle(id) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Debes iniciar sesión para realizar esta acción.');
  }

  // 1. Verificar permisos de Administrador
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Solo los administradores pueden borrar artículos.');
  }

  // 2. Ejecutar borrado
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error al borrar: ${error.message}`);
  }

  // 3. Revalidar rutas para actualizar la UI
  revalidatePath('/admin/articulos');
  revalidatePath('/admin');
  
  return { success: true };
}
