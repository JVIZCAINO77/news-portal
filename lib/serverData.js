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
    console.warn('[serverData] Supabase error, usando datos de muestra:', error.message);
    return SAMPLE_ARTICLES;
  }
  if (!data || data.length === 0) {
    console.info('[serverData] DB vacía, usando datos de muestra');
    return SAMPLE_ARTICLES;
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
    // Fallback a datos locales
    return SAMPLE_ARTICLES.find((a) => a.slug === slug) || null;
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
    return SAMPLE_ARTICLES.filter((a) => a.category === category).slice(0, limit);
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
    return SAMPLE_ARTICLES.filter((a) => a.featured).slice(0, limit);
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
    return SAMPLE_ARTICLES.filter((a) => a.trending).slice(0, limit);
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
    return [...SAMPLE_ARTICLES]
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }
  return data;
}

export async function getAllArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('publishedAt', { ascending: false });

  if (error || !data || data.length === 0) {
    return SAMPLE_ARTICLES;
  }
  return data;
}

