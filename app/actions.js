// app/actions.js
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Sincroniza un array de artículos al servidor (Supabase).
 * Usa upsert para insertar o actualizar según el id.
 */
export async function syncArticlesToServer(articles) {
  try {
    const supabase = createClient();
    
    // Verificar sesión (Protección contra intrusos)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[actions] Intento no autorizado de publicar un artículo');
      return { success: false, error: 'No autorizado. Debes iniciar sesión como administrador.' };
    }

    const { error } = await supabase
      .from('articles')
      .upsert(articles, { onConflict: 'id' });

    if (error) {
      console.error('[actions] Error sincronizando a Supabase:', error.message);
      return { success: false, error: error.message };
    }
    
    // Forzar recarga de caché en toda la página web
    revalidatePath('/', 'layout');
    
    return { success: true };
  } catch (err) {
    console.error('[actions] Error inesperado:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Elimina un artículo de Supabase por su id.
 */
export async function deleteArticleFromServer(id) {
  try {
    const supabase = createClient();
    
    // Verificar sesión (Protección contra intrusos)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[actions] Intento no autorizado de borrar un artículo');
      return { success: false, error: 'No autorizado. Debes iniciar sesión como administrador.' };
    }

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    
    // Forzar recarga de caché
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
