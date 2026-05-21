// lib/serverData.js — Server-side fetching for Articles (Supabase)
import { createClient } from '@supabase/supabase-js';
import { cache } from 'react'; // Memoización para evitar hits redundantes a la DB

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('[serverData] ⚠️ Variables de Supabase no configuradas.');
}

// Singleton del cliente — se reutiliza entre renders ISR del mismo worker.
// auth.persistSession:false y db.schema explicito reducen overhead de inicialización.
let supabase = null;
try {
  if (supabaseUrl && supabaseServiceRole) {
    supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
} catch (err) {
  console.error('[serverData] ❌ Error inicializando cliente Supabase:', err);
}

export const getLatestArticles = cache(async (limit = 10) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('articles')
    // Solo campos necesarios para tarjetas — excluimos 'content' que es el campo más pesado
    .select('id, title, slug, excerpt, image, imageAlt, category, author, publishedAt, featured, trending')
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching latest articles:', error);
    return [];
  }
  return data || [];
});

/**
 * Artículos relacionados para el sidebar del artículo.
 * Prioriza la misma categoría, completa con otros recientes.
 * 2 queries rápidas con índice — el resultado queda en caché ISR 1h.
 */
export const getRelatedArticles = cache(async (currentId, category, limit = 6) => {
  if (!supabase) return [];

  const fields = 'id, title, slug, category, publishedAt';

  // Query 1: misma categoría (excluyendo el artículo actual)
  const { data: sameCategory } = await supabase
    .from('articles')
    .select(fields)
    .eq('category', category)
    .neq('id', currentId)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if ((sameCategory?.length || 0) >= limit) {
    return sameCategory.slice(0, limit);
  }

  // Query 2: completar con otras categorías si no hay suficientes
  const needed = limit - (sameCategory?.length || 0);
  const { data: general } = await supabase
    .from('articles')
    .select(fields)
    .neq('id', currentId)
    .neq('category', category)
    .order('publishedAt', { ascending: false })
    .limit(needed);

  return [...(sameCategory || []), ...(general || [])].slice(0, limit);
});

export const getFeaturedArticles = cache(async (limit = 4) => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, image, imageAlt, category, author, publishedAt, featured, trending')
    .eq('featured', true)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
});

export async function getArticlesByCategory(category, limit = 10) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, image, imageAlt, category, author, publishedAt, featured, trending')
    .eq('category', category)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export const getArticleBySlug = cache(async (slug) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
});

export async function getAllArticles() {
  if (!supabase) return [];
  // Solo necesitamos slug y publishedAt para el sitemap
  const { data, error } = await supabase
    .from('articles')
    .select('slug, publishedAt')
    .order('publishedAt', { ascending: false })
    .limit(5000); // Techo de seguridad para evitar saturación de memoria en ISR

  if (error) return [];
  return data || [];
}

/**
 * Obtiene los artículos de mayor impacto del día actual.
 * Orden de prioridad:
 *   1. trending=true publicados hoy (los más urgentes/virales)
 *   2. featured=true publicados hoy (editorialmente destacados)
 *   3. Más vistas hoy (mayor audiencia)
 *   4. Más recientes hoy (por si hay pocos artículos)
 *
 * Si hoy hay menos de `minRequired`, complementa con los
 * artículos featured/trending más recientes de los últimos 3 días.
 */
export const getDailyTopArticles = cache(async (limit = 12, minRequired = 6) => {
  if (!supabase) return [];
  // ... rest of the code ...
  const now = new Date();
  let startOfDay, endOfDay;
  try {
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(now);
    startOfDay = new Date(`${todayStr}T00:00:00-04:00`).toISOString();
    endOfDay   = new Date(`${todayStr}T23:59:59-04:00`).toISOString();
  } catch (err) {
    console.error('[getDailyTopArticles] Date calculation error:', err);
    startOfDay = new Date(now.setHours(0,0,0,0)).toISOString();
    endOfDay = new Date(now.setHours(23,59,59,999)).toISOString();
  }

  const CARD_FIELDS = 'id, title, slug, excerpt, image, imageAlt, category, author, publishedAt, featured, trending, views';

  // 1️⃣ Query única optimizada: todos los artículos de HOY ordenados por prioridad compuesta.
  // trending > featured > views > recencia. Elimina el 2do round-trip a Supabase.
  const { data: topToday } = await supabase
    .from('articles')
    .select(CARD_FIELDS)
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay)
    .order('trending', { ascending: false })
    .order('featured', { ascending: false })
    .order('views', { ascending: false })
    .order('publishedAt', { ascending: false })
    .limit(limit);

  const seen = new Set();
  const combined = [];

  if (topToday) {
    for (const art of topToday) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        combined.push(art);
      }
    }
  }

  if (combined.length >= minRequired) {
    return combined.slice(0, limit);
  }

  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentTop } = await supabase
    .from('articles')
    .select(CARD_FIELDS)
    .or('featured.eq.true,trending.eq.true')
    .gte('publishedAt', threeDaysAgo)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (recentTop) {
    for (const art of recentTop) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        combined.push(art);
      }
    }
  }

  if (combined.length < limit) {
    const { data: fallback } = await supabase
      .from('articles')
      .select(CARD_FIELDS)
      .order('publishedAt', { ascending: false })
      .limit(limit);
    if (fallback) {
      for (const art of fallback) {
        if (!seen.has(art.id)) {
          seen.add(art.id);
          combined.push(art);
        }
      }
    }
  }

  return combined.slice(0, limit);
});

export async function getArticlesPaginated(limit = 10, offset = 0) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, image, imageAlt, category, author, publishedAt, featured, trending')
    .order('publishedAt', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching paginated articles:', error);
    return [];
  }
  return data || [];
}

export async function searchArticles(query) {
  if (!query) return [];
  if (!supabase) return [];

  // ─── Sanitización defensiva ─────────────────────────────────────────────
  // 1. Limitar longitud (evita ReDoS y abuso de recursos)
  // 2. Escapar caracteres especiales de SQL LIKE: %, _, \
  // 3. Eliminar caracteres que romperían el operador PostgREST .cs.{...}
  const safeQuery = query
    .slice(0, 100)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/[{}\[\]"'`]/g, '');

  // Búsqueda ilike en título, resumen y contenido (sin tags.cs inseguro)
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, slug, excerpt, image, imageAlt, category, author, publishedAt, featured, trending')
    .or(`title.ilike.%${safeQuery}%,excerpt.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
    .order('publishedAt', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[searchArticles] Error en búsqueda:', error.message);
    return [];
  }
  return data || [];
}
