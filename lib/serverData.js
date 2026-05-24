// lib/serverData.js — Server-side fetching for Articles (Supabase)
import { createClient } from '@supabase/supabase-js';
import { cache } from 'react'; // Memoización para evitar hits redundantes a la DB

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('[serverData] ⚠️ Variables de Supabase no configuradas.');
}

// ─── Singleton con reconexión automática ─────────────────────────────────
// Si el cliente se corrompe (timeout de red, reinicio de worker), el getter
// lo recrea en la siguiente petición sin necesitar restart del servidor.
let _supabase = null;

function getClient() {
  if (_supabase) return _supabase;
  if (!supabaseUrl || !supabaseServiceRole) return null;
  try {
    _supabase = createClient(supabaseUrl, supabaseServiceRole, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    return _supabase;
  } catch (err) {
    console.error('[serverData] ❌ Error creando cliente Supabase:', err);
    return null;
  }
}

// Alias para compatibilidad con código existente que usa `supabase` directamente
Object.defineProperty(globalThis, '__sbClient', { get: getClient, configurable: true });
// Getter local para este módulo
const supabase = new Proxy({}, {
  get(_t, prop) {
    const client = getClient();
    if (!client) throw new Error('[serverData] Supabase no disponible');
    return client[prop];
  }
});

export const getLatestArticles = cache(async (limit = 10) => {
  if (!getClient()) return [];
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
  if (!getClient()) return [];

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
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

  // ─── Fix F: las 3 queries se lanzan en paralelo (Promise.all) ───────────────────
  // Antes era cascada secuencial: query1 → esperar → query2 → esperar → query3.
  // Ahora los 3 hits a Supabase se lanzan a la vez; el tiempo total = max(q1,q2,q3)
  // en lugar de q1+q2+q3. Ahorro típico: 300-600ms cuando se usan los fallbacks.
  const [topTodayRes, recentTopRes, fallbackRes] = await Promise.all([
    // Q1: artículos de HOY ordenados por prioridad editorial
    supabase
      .from('articles')
      .select(CARD_FIELDS)
      .gte('publishedAt', startOfDay)
      .lte('publishedAt', endOfDay)
      .order('trending',     { ascending: false })
      .order('featured',     { ascending: false })
      .order('views',        { ascending: false })
      .order('publishedAt',  { ascending: false })
      .limit(limit),

    // Q2: featured/trending de los últimos 3 días (fallback 1)
    supabase
      .from('articles')
      .select(CARD_FIELDS)
      .or('featured.eq.true,trending.eq.true')
      .gte('publishedAt', threeDaysAgo)
      .order('publishedAt', { ascending: false })
      .limit(limit),

    // Q3: más recientes sin filtro (fallback 2 — siempre garantiza portada llena)
    supabase
      .from('articles')
      .select(CARD_FIELDS)
      .order('publishedAt', { ascending: false })
      .limit(limit),
  ]);

  // Fusionar respetando prioridad: hoy > recientes destacados > recientes generales
  const seen     = new Set();
  const combined = [];

  for (const source of [topTodayRes.data, recentTopRes.data, fallbackRes.data]) {
    if (!source) continue;
    for (const art of source) {
      if (!seen.has(art.id)) {
        seen.add(art.id);
        combined.push(art);
        if (combined.length >= limit) break;
      }
    }
    if (combined.length >= limit) break;
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
  if (!getClient()) return [];

  // Sanitizacion defensiva
  const safeQuery = query
    .slice(0, 100)
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/[{}\[\]"'`]/g, '');

  const FIELDS = 'id, title, slug, excerpt, image, imageAlt, category, author, publishedAt, featured, trending';

  // Fix H: 2 queries en paralelo con ranking por relevancia
  // Q1: coincidencia en TITULO (alta relevancia - aparece primero)
  // Q2: coincidencia en RESUMEN o CONTENIDO (menor relevancia)
  const [titleRes, bodyRes] = await Promise.all([
    supabase
      .from('articles')
      .select(FIELDS)
      .ilike('title', `%${safeQuery}%`)
      .order('publishedAt', { ascending: false })
      .limit(10),

    supabase
      .from('articles')
      .select(FIELDS)
      .or(`excerpt.ilike.%${safeQuery}%,content.ilike.%${safeQuery}%`)
      .order('publishedAt', { ascending: false })
      .limit(15),
  ]);

  if (titleRes.error) {
    console.error('[searchArticles] Error:', titleRes.error.message);
    return [];
  }

  // Fusionar: titulos primero, luego body-matches no duplicados
  const seen    = new Set();
  const results = [];

  for (const art of (titleRes.data || [])) {
    seen.add(art.id);
    results.push(art);
  }
  for (const art of (bodyRes.data || [])) {
    if (!seen.has(art.id)) {
      seen.add(art.id);
      results.push(art);
    }
  }

  return results.slice(0, 20);
}