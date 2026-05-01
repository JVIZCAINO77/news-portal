// app/articulo/[slug]/page.js — Estructura Editorial SSR 2.0
import { getArticleBySlug, getLatestArticles } from '@/lib/serverData';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import SocialShare from '@/components/SocialShare';
import AudioReader from '@/components/AudioReader';
import AdUnit from '@/components/AdUnit';
import NewsletterBox from '@/components/NewsletterBox';
import ArticleCard from '@/components/ArticleCard';
import { formatDate, getCategoryBySlug, parseTags, SITE_CONFIG, calculateReadingTime, CATEGORIES } from '@/lib/data';

import Image from 'next/image';
import Link from 'next/link';
import PremiumImage from '@/components/PremiumImage';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidar cada minuto para noticias frescas

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) return { title: 'Noticia no encontrada | Imperio Público' };

  return {
    title: article.title,
    description: article.excerpt || article.content?.substring(0, 160),
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `${SITE_CONFIG.url}/articulo/${slug}`,
      siteName: SITE_CONFIG.name,
      images: [{ url: article.image, width: 1200, height: 630 }],
      type: 'article',
      publishedTime: article.publishedAt,
      authors: [article.author || SITE_CONFIG.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.image],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  // Cargar noticias relacionadas (misma categoría o recientes)
  const latest = await getLatestArticles(10);
  const related = latest.filter(a => a.id !== article.id).slice(0, 6);

  const cleanText = (str) => {
    if (!str) return '';
    return str
      .replace(/#+/g, '') 
      .replace(/_{1,}/g, '') 
      .replace(/\\+n/g, ' ') // Limpieza agresiva: cualquier variante de \n a espacio en títulos/resúmenes
      .trim();
  };

  const displayTitle = cleanText(article.title);
  const displayExcerpt = cleanText(article.excerpt);
  
  // Procesamiento de párrafos más robusto
  const paragraphs = (article.content || '')
    .replace(/\\+n/g, '\n') // CORRECCIÓN AGRESIVA: Convierte cualquier variante de \n literal en salto real
    // Limpia bloque de etiquetas SEO al FINAL del contenido (sin 'g' para evitar borrar ocurrencias internas)
    .replace(/\n?[\s\*]*etiquetas\s*(seo)?\s*:.*$/is, '')
    .replace(/\n?[\s\*]*palabras\s*clave\s*:.*$/is, '')
    .replace(/\n?[\s\*]*keywords?\s*:.*$/is, '')
    .split('\n')
    .map(p => p.trim())
    .filter(p => p !== '' && p !== '---') // Elimina líneas vacías y separadores markdown
    .map(p => p.replace(/^#+\s*/g, '')); // Elimina ## al inicio

  // Normalize tags: handles array, Postgres {"a","b"}, JSON ["a","b"] or plain comma-string
  const tagsList = parseTags(article.tags);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_CONFIG.url}/articulo/${article.slug}`
    },
    "headline": displayTitle,
    "description": displayExcerpt,
    "image": [article.image],
    "datePublished": article.publishedAt,
    "dateModified": article.updated_at || article.publishedAt,
    "author": [{
      "@type": "Person",
      "name": article.author || "Redacción Imperio Público",
      "url": SITE_CONFIG.url
    }],
    "keywords": tagsList.join(', '),
    "publisher": {
      "@type": "Organization",
      "name": SITE_CONFIG.name,
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_CONFIG.url}${SITE_CONFIG.logo}`
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="bg-background min-h-screen transition-colors duration-500">
        <ReadingProgressBar />
        <SocialShare title={article.title} />
        
        <div className="max-w-6xl mx-auto px-6 py-4 md:py-8">
          
          {/* 1. CABECERA EDITORIAL */}
          <header className="mb-4 md:mb-10 border-b-[3px] border-black pb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                {article.category?.toLowerCase() !== 'noticias' && (
                  <span className="bg-red-600 text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest italic">
                    {article.category}
                  </span>
                )}
                {(article.featured || article.trending) && (
                  <span className="flex items-center gap-1.5 bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-widest animate-pulse">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    {article.trending ? 'Tendencia Global' : 'Impacto Nacional'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                <span>{formatDate(article.publishedAt)}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="flex items-center gap-1">
                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {calculateReadingTime(article.content)} min
                </span>
              </div>
            </div>
            <h1 className="editorial-title text-4xl md:text-6xl lg:text-8xl leading-[0.95] tracking-tighter">
              {displayTitle}
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <div className="lg:col-span-8 space-y-6">
              
              <figure className="mb-10 group animate-in fade-in zoom-in-95 duration-1000 delay-200">
                <PremiumImage 
                  src={article.image} 
                  alt={article.imageAlt || article.title}
                  containerClassName="w-full min-h-[300px] md:min-h-[500px] max-h-[85vh] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] rounded-3xl border border-slate-100 group-hover:border-red-100 transition-colors"
                  className="w-full h-full object-cover transition-transform group-hover:scale-[1.01] duration-1000"
                  priority={true}
                />
                {article.imageAlt && (
                  <figcaption className="mt-4 text-center overline-label !text-slate-400 italic">
                    Créditos: {article.imageAlt}
                  </figcaption>
                )}
              </figure>

              <p className="text-xl md:text-2xl font-serif text-slate-800 leading-snug">
                {displayExcerpt}
              </p>

              <AudioReader title={displayTitle} text={article.content} />

              <div className="prose-news pt-4">
                {article.content?.trim().startsWith('<') ? (
                  <div 
                    className="article-html-content"
                    dangerouslySetInnerHTML={{
                      __html: article.content
                        .replace(/\\+n/g, '<br/>') // Convertir \n literal en break HTML
                        .replace(/#+\s*/g, '') 
                        .replace(/<p[^>]*>(?:\s|&nbsp;)*<\/p>/gi, '') 
                        .replace(/<p([^>]*)>/, (match, attrs) => {
                          return `<p class="paragraph-text"${attrs}>`;
                        })
                    }} 
                  />
                ) : (
                  <div className="">
                    {paragraphs.map((rawP, i) => {
                        const isSubheading = rawP.startsWith('##');
                        const p = rawP.replace(/#+/g, '').replace(/_/g, '').trim(); 
                        if (p.length === 0) return null;

                        const imgMatch = p.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
                        if (imgMatch) {
                          const alt = imgMatch[1];
                          const src = imgMatch[2];
                          return (
                            <figure key={i} className="my-10 -mx-4 md:-mx-8">
                                <PremiumImage 
                                  src={src} 
                                  alt={alt} 
                                  containerClassName="w-full shadow-xl border border-slate-100 rounded-xl"
                                  className="w-full h-auto object-contain block mx-auto" 
                                />
                              {alt && <figcaption className="mt-3 px-4 text-center overline-label !text-slate-400">Figura: {alt}</figcaption>}
                            </figure>
                          );
                        }

                        if (isSubheading) {
                          return (
                            <h2 key={i} className="text-2xl md:text-3xl font-black text-black uppercase tracking-tighter mt-10 mb-4 border-l-4 border-red-600 pl-4 italic">
                              {p}
                            </h2>
                          );
                        }

                        const formattedText = p
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em class="italic text-slate-500">$1</em>');

                        return (
                          <div key={i} className="relative">
                            <div
                              className="paragraph-text"
                              dangerouslySetInnerHTML={{ __html: formattedText }}
                            />
                            {i === 1 && <AdUnit format="in-article" slot="article_mid" className="my-6 py-4 border-y border-slate-100" />}
                          </div>
                        );
                    })}
                  </div>
                )}
              </div>

              {/* SECCIÓN DE TEMAS Y AUTOR */}
              <div className="mt-12 space-y-8 border-t border-slate-100 pt-8">
                {article.source_link && (
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-sm border-l-4 border-slate-300">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Fuente:</span>
                    <a 
                      href={article.source_link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] font-bold text-red-600 hover:underline uppercase tracking-tight flex items-center gap-1"
                    >
                      {article.source_name || (article.source_link.includes('deultimominuto') ? 'De Último Minuto' : article.source_link.includes('desenredandodr') ? 'Desenredando RD' : 'Ver Fuente Original')}
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                    </a>
                  </div>
                )}

                {tagsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-black text-white px-2 py-1 text-[10px] font-black uppercase tracking-widest leading-none">TEMAS:</span>
                    <div className="flex flex-wrap gap-2">
                      {tagsList.map((tag, idx) => (
                        <Link 
                          key={idx} 
                          href={`/buscar?q=${encodeURIComponent(tag)}`}
                          className="border border-slate-200 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase hover:bg-red-600 hover:text-white hover:border-red-600 transition-all"
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-[#F9FAFB] border border-slate-100 p-6 md:p-8 rounded-sm flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start group">
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <div className="absolute inset-0 bg-red-600 rounded-full scale-[1.03] opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    {article.author_avatar ? (
                      <img 
                        src={article.author_avatar} 
                        alt={article.author} 
                        className="w-full h-full rounded-full object-cover border-4 border-white shadow-md relative z-10" 
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-black text-4xl rounded-full border-4 border-white shadow-md relative z-10 ${article.author_avatar ? 'hidden' : 'flex'}`}>
                      {article.author?.[0] || 'A'}
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left space-y-3">
                    <h3 className="text-xl md:text-2xl font-black text-red-600 uppercase tracking-tighter italic leading-none">
                      {article.author || 'Redacción Imperio Público'}
                    </h3>
                    <p className="text-sm md:text-base text-slate-600 leading-relaxed font-serif italic max-w-2xl">
                      {article.author_bio || 'Periodista especializado en actualidad y análisis editorial. Corresponsal comprometido con la veracidad informativa en el equipo de Imperio Público.'}
                    </p>
                    
                    <div className="flex items-center justify-center md:justify-start gap-4 pt-2">
                      <a href={`mailto:${article.author_email || 'info@imperiopublico.com'}`} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-600 shadow-sm transition-all hover:scale-110" title="Email">
                        <span className="font-bold text-lg">@</span>
                      </a>
                      <a href={SITE_CONFIG.social.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-black hover:border-black shadow-sm transition-all hover:scale-110" title="X (Twitter)">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z" /></svg>
                      </a>
                      <a href={SITE_CONFIG.social.facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-600 shadow-sm transition-all hover:scale-110" title="Facebook">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                      </a>
                      <a href={SITE_CONFIG.social.instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-pink-600 hover:border-pink-600 shadow-sm transition-all hover:scale-110" title="Instagram">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-4 border-l border-gray-100 lg:pl-12">
              <div className="sticky top-32">
                <h2 className="section-title w-full">Lo más reciente</h2>
                <div className="space-y-8 mt-8">
                  {related.map((a, idx) => (
                    <Link key={a.id} href={`/articulo/${a.slug}`} className="group flex gap-5 items-start border-b border-slate-50 pb-6 last:border-0">
                      <span className="text-4xl font-black text-slate-100 font-serif group-hover:text-red-600 transition-colors leading-none">{idx + 1}</span>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">{getCategoryBySlug(a.category)?.label}</span>
                        <h3 className="text-[13px] font-black uppercase tracking-tight leading-tight group-hover:underline">{a.title}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-16">
                   <AdUnit format="rectangle" slot="article_sidebar" />
                </div>
              </div>
            </aside>
          </div>

          <section className="mt-20 pt-10 border-t-4 border-black">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-10 italic">Más Noticias Relacionadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {related.slice(0, 3).map(a => (
                <ArticleCard key={a.id} article={a} variant="medium" className="bg-slate-50 p-6 border border-gray-100" />
              ))}
            </div>
          </section>

        </div>
      </article>

      {/* Newsletter - Full Width and Edge to Edge */}
      <div className="w-full">
        <NewsletterBox />
      </div>
    </>
  );
}
