// lib/serverData.js — Server-side fetching for Articles (Supabase)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Simple client for server-side operations (bypassing RLS if necessary)
const supabase = createClient(supabaseUrl, supabaseServiceRole);

export async function getLatestArticles(limit = 10) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
  return data || [];
}

export async function getFeaturedArticles(limit = 4) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('featured', true)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export async function getArticlesByCategory(category, limit = 10) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error) return [];
  return data || [];
}

export async function getArticleBySlug(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data;
}

export async function getAllArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('publishedAt', { ascending: false });

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
export async function getDailyTopArticles(limit = 12, minRequired = 6) {
  // Rango del día de hoy en UTC (la BD guarda en UTC)
  const now = new Date();
  // Inicio y fin del día en hora de República Dominicana (UTC-4)
  const todayStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  const startOfDay = new Date(`${todayStr}T00:00:00-04:00`).toISOString();
  const endOfDay   = new Date(`${todayStr}T23:59:59-04:00`).toISOString();

  // 1️⃣ Trending del día (Urgencia/Impacto)
  const { data: trendingToday } = await supabase
    .from('articles')
    .select('*')
    .eq('trending', true)
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  // 2️⃣ Featured del día (Interés Editorial)
  const { data: featuredToday } = await supabase
    .from('articles')
    .select('*')
    .eq('featured', true)
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  // 3️⃣ Más vistas del día (Interés de Audiencia)
  const { data: mostViewedToday } = await supabase
    .from('articles')
    .select('*')
    .gte('publishedAt', startOfDay)
    .lte('publishedAt', endOfDay)
    .order('views', { ascending: false })
    .limit(limit);

  // Combinar en orden de prioridad absoluta para la portada
  const seen = new Set();
  const combined = [];
  
  // Prioridad 1: Trending de HOY (Impacto Crítico)
  if (trendingToday) {
    for (const art of trendingToday) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        combined.push(art);
      }
    }
  }

  // Prioridad 2: Featured de HOY (Interés Nacional/Internacional)
  if (featuredToday) {
    for (const art of featuredToday) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        combined.push(art);
      }
    }
  }

  // Prioridad 3: Más vistas de HOY
  if (mostViewedToday) {
    for (const art of mostViewedToday) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        combined.push(art);
      }
    }
  }

  // Si hay suficientes artículos de hoy, retornar
  if (combined.length >= minRequired) {
    return combined.slice(0, limit);
  }

  // 4️⃣ Fallback: artículos destacados/trending de los últimos 3 días
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentTop } = await supabase
    .from('articles')
    .select('*')
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

  // 5️⃣ Último fallback: simplemente los más recientes
  if (combined.length < limit) {
    const { data: fallback } = await supabase
      .from('articles')
      .select('*')
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
}

export async function getArticlesPaginated(limit = 10, offset = 0) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
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
  
  // Búsqueda flexible en título, resumen, contenido y etiquetas/tags
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
    .order('publishedAt', { ascending: false })
    .limit(20);

  if (error) {
    // Fallback sin búsqueda por tags si la columna no soporta el operador
    const { data: fallbackData } = await supabase
      .from('articles')
      .select('*')
      .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
      .order('publishedAt', { ascending: false })
      .limit(20);
    return fallbackData || [];
  }
  return data || [];
}
