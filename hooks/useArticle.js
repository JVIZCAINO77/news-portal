// hooks/useArticle.js — Hook cliente para cargar un artículo y los más recientes
'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useArticle(slug) {
  const [article, setArticle] = useState(null);
  const [latest, setLatest] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const supabase = createClient();

    async function fetchData() {
      setLoading(true);

      // Fetch the article by slug
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (articleError || !articleData) {
        setArticle(null);
        setLoading(false);
        return;
      }

      setArticle(articleData);

      // Fetch latest articles excluding the current one
      const { data: latestData } = await supabase
        .from('articles')
        .select('*')
        .neq('slug', slug)
        .order('publishedAt', { ascending: false })
        .limit(6);

      setLatest(latestData || []);
      setLoading(false);
    }

    fetchData();
  }, [slug]);

  return { article, latest, loading };
}
