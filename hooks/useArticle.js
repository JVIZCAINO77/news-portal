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

    // AbortController para evitar state updates en componentes desmontados
    const controller = new AbortController();
    const supabase = createClient();

    async function fetchData() {
      setLoading(true);

      // Fetch del artículo — select('*') necesario aquí porque se renderiza el content completo
      const { data: articleData, error: articleError } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();

      if (controller.signal.aborted) return;

      if (articleError || !articleData) {
        setArticle(null);
        setLoading(false);
        return;
      }

      setArticle(articleData);

      // Incrementar vistas via API segura (atómica, sin race condition)
      // Usamos nuestro endpoint /api/articles/view que usa RPC o update server-side
      fetch('/api/articles/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
        signal: controller.signal,
      }).catch(() => {}); // Silencioso — las vistas no deben bloquear UX

      // Artículos relacionados — solo campos de tarjeta, sin content
      const { data: latestData } = await supabase
        .from('articles')
        .select('id, title, slug, excerpt, image, imageAlt, category, author, publishedAt, featured, trending')
        .neq('slug', slug)
        .order('publishedAt', { ascending: false })
        .limit(6);

      if (controller.signal.aborted) return;

      setLatest(latestData || []);
      setLoading(false);
    }

    fetchData();

    return () => controller.abort();
  }, [slug]);

  return { article, latest, loading };
}
