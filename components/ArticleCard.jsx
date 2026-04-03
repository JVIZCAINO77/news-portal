// components/ArticleCard.jsx — Tarjeta de artículo reutilizable
import Link from 'next/link';
import Image from 'next/image';
import { getCategoryBySlug, formatDateShort } from '@/lib/data';

/**
 * Variantes:
 *  'hero'    — tarjeta grande con imagen de fondo (página principal)
 *  'medium'  — tarjeta mediana (grids secundarios)
 *  'small'   — tarjeta pequeña horizontal (listas, trending, sidebar)
 *  'list'    — sólo texto, sin imagen (opinión, análisis)
 */
export default function ArticleCard({ article, variant = 'medium', className = '' }) {
  const cat = getCategoryBySlug(article.category);

  if (variant === 'hero') {
    return (
      <Link href={`/articulo/${article.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <article
          className={`article-card ${className}`}
          style={{
            position: 'relative', borderRadius: 10, overflow: 'hidden',
            background: '#111', cursor: 'pointer',
            aspectRatio: '16/9', minHeight: 420,
          }}
        >
          <Image
            src={article.image}
            alt={article.imageAlt || article.title}
            fill
            sizes="(max-width: 768px) 100vw, 70vw"
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className="img-overlay" style={{ position: 'absolute', inset: 0 }} />
          {article.trending && (
            <div style={{
              position: 'absolute', top: 16, left: 16,
              background: 'var(--color-primary)', color: '#fff',
              padding: '4px 10px', borderRadius: 4,
              fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span className="live-dot" style={{ width: 6, height: 6 }} /> Trending
            </div>
          )}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 24px 20px' }}>
            {cat && (
              <span className="cat-badge" style={{ background: cat.color, color: '#fff', marginBottom: 8, display: 'inline-flex' }}>
                {cat.emoji} {cat.label}
              </span>
            )}
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 10 }}>
              {article.title}
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.excerpt}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
              <span style={{ fontWeight: 600 }}>{article.author}</span>
              <span>·</span>
              <span>{formatDateShort(article.publishedAt)}</span>
              <span>·</span>
              <span>{article.readTime} min lectura</span>
              {article.views > 5000 && (
                <>
                  <span>·</span>
                  <span>👁 {(article.views / 1000).toFixed(1)}K</span>
                </>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'medium') {
    return (
      <Link href={`/articulo/${article.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <article
          className={`article-card ${className}`}
          style={{
            borderRadius: 8, overflow: 'hidden',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            cursor: 'pointer', height: '100%',
          }}
        >
          <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
            <Image
              src={article.image}
              alt={article.imageAlt || article.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
            {cat && (
              <div style={{ position: 'absolute', top: 10, left: 10 }}>
                <span className="cat-badge" style={{ background: cat.color, color: '#fff' }}>
                  {cat.emoji} {cat.label}
                </span>
              </div>
            )}
          </div>
          <div style={{ padding: '16px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.05rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.title}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.excerpt}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-text-dim)' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{article.author}</span>
              <span>·</span>
              <span>{formatDateShort(article.publishedAt)}</span>
              <span>·</span>
              <span>{article.readTime} min</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'small') {
    return (
      <Link href={`/articulo/${article.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
        <article
          className={`article-card ${className}`}
          style={{
            display: 'flex', gap: 12, cursor: 'pointer',
            padding: '12px 0',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ position: 'relative', width: 80, height: 60, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
            <Image
              src={article.image}
              alt={article.imageAlt || article.title}
              fill
              sizes="80px"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {cat && (
              <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {cat.label}
              </span>
            )}
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {article.title}
            </h4>
            <p style={{ fontSize: 11, color: 'var(--color-text-dim)', marginTop: 4 }}>
              {formatDateShort(article.publishedAt)} · {article.readTime} min
            </p>
          </div>
        </article>
      </Link>
    );
  }

  // list variant
  return (
    <Link href={`/articulo/${article.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <article
        className={`article-card ${className}`}
        style={{
          padding: '16px 0',
          borderBottom: '1px solid var(--color-border)',
          cursor: 'pointer',
        }}
      >
        {cat && (
          <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {cat.emoji} {cat.label}
          </span>
        )}
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 700, color: '#fff', lineHeight: 1.3, margin: '6px 0' }}>
          {article.title}
        </h4>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5, marginBottom: 8 }}>
          {article.excerpt}
        </p>
        <div style={{ fontSize: 12, color: 'var(--color-text-dim)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>{article.author}</span>
          {' · '}{formatDateShort(article.publishedAt)} · {article.readTime} min lectura
        </div>
      </article>
    </Link>
  );
}
