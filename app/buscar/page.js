import { getArticles } from '@/lib/serverData';
import ArticleCard from '@/components/ArticleCard';

export const metadata = {
  title: 'Resultados de Búsqueda | PulsoNoticias',
  description: 'Encuentra las últimas noticias, reportajes y artículos en PulsoNoticias.',
};

export default async function SearchPage({ searchParams }) {
  // En Next.js 16/15, searchParams a menudo se requiere awai-tear si se accede directamente a sus propiedades, o se recibe como Promise, pero para evitar errores lo destructuramos:
  const params = await searchParams;
  const query = params?.q || '';
  
  const allArticles = await getArticles();
  
  let results = [];
  if (query.trim().length > 0) {
    const term = query.toLowerCase().trim();
    results = allArticles.filter((article) => {
      return (
        (article.title && article.title.toLowerCase().includes(term)) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(term)) ||
        (article.content && article.content.toLowerCase().includes(term))
      );
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <form method="GET" action="/buscar" style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <input 
          type="text" 
          name="q" 
          defaultValue={query}
          placeholder="Buscar noticias, farándula, deportes..." 
          style={{ flex: 1, padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: '#fff', fontSize: 16 }}
        />
        <button type="submit" style={{ padding: '0 24px', background: 'var(--color-primary)', color: '#fff', borderRadius: 8, fontWeight: 600 }}>
          Buscar
        </button>
      </form>

      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 32, fontWeight: 800, marginBottom: 8, color: '#fff' }}>
        Resultados para: "{query}"
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 32 }}>
        {results.length} artículos encontrados.
      </p>

      {query.trim().length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', border: '1px solid var(--color-border)', borderRadius: 12 }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>
            Por favor, escribe un término de búsqueda para comenzar.
          </p>
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {results.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '64px 0', border: '1px solid var(--color-border)', borderRadius: 12 }}>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 18 }}>
            No encontramos ninguna noticia que coincida con "{query}".
          </p>
          <p style={{ color: 'var(--color-text-muted)', opacity: 0.7, marginTop: 8 }}>
            Intenta con otras palabras clave menos específicas.
          </p>
        </div>
      )}
    </div>
  );
}
