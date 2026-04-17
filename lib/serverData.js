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
  
  // Búsqueda flexible en título, resumen y contenido
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
    .order('publishedAt', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error searching articles:', error);
    return [];
  }
  return data || [];
}
