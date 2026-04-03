// lib/serverData.js
// Esta capa lee desde Supabase Cloud, sirviendo datos en tiempo real al frontend de forma optimizada
import { supabase } from './supabase';
import { SAMPLE_ARTICLES } from './data';

export async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('publishedAt', { ascending: false });

  if (error) {
    console.warn('[serverData] Supabase error:', error.message);
    return [];
  }
  if (!data || data.length === 0) {
    console.info('[serverData] DB vacía, retornando array vacío');
    return [];
  }
  return data;
}

export async function getArticleBySlug(slug) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }
  return data;
}

export async function getArticlesByCategory(category, limit = 10) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('category', category)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    return [];
  }
  return data;
}

export async function getFeaturedArticles(limit = 3) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('featured', true)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    return [];
  }
  return data;
}

export async function getTrendingArticles(limit = 5) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('trending', true)
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    return [];
  }
  return data;
}

export async function getLatestArticles(limit = 8) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('publishedAt', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) {
    return [];
  }
  return data;
}

export async function getAllArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('publishedAt', { ascending: false });

  if (error || !data || data.length === 0) {
    return [];
  }
  return data;
}

