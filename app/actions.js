// app/actions.js
'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Sincroniza un array de artículos al servidor (Supabase).
 * Usa upsert para insertar o actualizar según el id.
 */
export async function syncArticlesToServer(articles) {
  try {
    const { error } = await supabase
      .from('articles')
      .upsert(articles, { onConflict: 'id' });

    if (error) {
      console.error('[actions] Error sincronizando a Supabase:', error.message);
      return { success: false, error: error.message };
    }
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
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

