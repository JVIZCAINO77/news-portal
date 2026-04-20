// app/articulo/[slug]/page.js — Estructura Editorial 2.0 (Restaurada)
'use client';
import { useArticle } from '@/hooks/useArticle';
import { useParams } from 'next/navigation';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import SocialShare from '@/components/SocialShare';
import AudioReader from '@/components/AudioReader';
import AdUnit from '@/components/AdUnit';
import NewsletterBox from '@/components/NewsletterBox';
import ArticleCard from '@/components/ArticleCard';
import { formatDate, getCategoryBySlug } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import Head from 'next/head';

export default function ArticlePage() {
  const { slug } = useParams();
  const { article, latest, loading } = useArticle(slug);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-slate-200">Cargando Historia...</div>;
  if (!article) return <div className="min-h-screen flex items-center justify-center font-black uppercase tracking-widest text-red-600">404 - Noticia no encontrada</div>;

  const paragraphs = article.content?.split('\n').filter(p => p.trim() !== '') || [];
  const cat = getCategoryBySlug(article.category);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.image],
    "datePublished": article.publishedAt,
    "author": [{
      "@type": "Person",
      "name": article.author || "Redacción Imperio Público",
      "url": "https://www.imperiopublico.com"
    }]
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
        
        {/* ENTORNO DE LECTURA COMPACTO */}
        <div className="max-w-6xl mx-auto px-6 py-4 md:py-8">
          
          {/* 1. CABECERA EDITORIAL */}
          <header className="mb-4 md:mb-6 border-b-[3px] border-black pb-4">
            <div className="flex items-center justify-between mb-4">
              <span className="section-title !mb-0">{article.category}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                Publicado el {formatDate(article.publishedAt)}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-black leading-[0.95] tracking-tighter italic uppercase">
              {article.title}
            </h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* COLUMNA PRINCIPAL */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* IMAGEN PRINCIPAL (16:9) */}
              <figure className="mb-6">
                <div className="relative w-full aspect-video overflow-hidden bg-slate-50 shadow-2xl rounded-2xl border border-slate-100 transition-transform hover:scale-[1.01] duration-700">
                  <Image 
                    src={article.image} 
                    alt={article.imageAlt || article.title} 
                    fill 
                    className="object-cover" 
                    priority 
                    sizes="(max-width: 1280px) 100vw, 1280px"
                  />
                </div>
                {article.imageAlt && (
                  <figcaption className="mt-2 text-center overline-label !text-slate-400 italic">
                    Créditos: {article.imageAlt}
                  </figcaption>
                )}
              </figure>

              {/* BAJADA / EXCERPT */}
              <p className="text-xl md:text-2xl font-serif italic text-slate-600 leading-tight">
                {article.excerpt}
              </p>

              {/* AUDIO READER */}
              <AudioReader title={article.title} text={article.content} />

              {/* CUERPO DE LA NOTICIA */}
              <div className="prose-news pt-4">
                {article.content?.trim().startsWith('<') ? (
                  <div 
                    className="article-html-content space-y-2"
                    dangerouslySetInnerHTML={{ 
                      __html: article.content.replace(/<p[^>]*>(?:\s|#[\w-áéíóúñÁÉÍÓÚÑ]+|&nbsp;)+<\/p>/gi, '') 
                    }} 
                  />
                ) : (
                  <div className="space-y-2">
                    {paragraphs.map((p, i) => {
                        if (p.trim().match(/^(#[\w-áéíóúñÁÉÍÓÚÑ]+\s*)+$/)) return null;
                        const imgMatch = p.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
                        if (imgMatch) {
                          const alt = imgMatch[1];
                          const src = imgMatch[2];
                          return (
                            <figure key={i} className="my-4 -mx-4 md:-mx-8">
                              <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shadow-xl border border-slate-200 rounded-xl">
                                <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
                              </div>
                              {alt && <figcaption className="mt-2 px-4 text-center overline-label !text-slate-400">Figura: {alt}</figcaption>}
                            </figure>
                          );
                        }
                        const formattedText = p
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black">$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em class="italic text-slate-500 font-medium">$1</em>');
                        const isFirstParagraph = i === 0;
                        return (
                          <div key={i} className="relative">
                            <div
                              className={`${isFirstParagraph ? 'drop-cap' : 'paragraph-text'}`}
                              dangerouslySetInnerHTML={{ __html: formattedText }}
                            />
                            {i === 1 && <AdUnit format="in-article" className="my-6 py-4 border-y border-slate-100" />}
                          </div>
                        );
                    })}
                  </div>
                )}
              </div>

              {/* FIRMA DE AUTOR */}
              <div className="py-8 border-y border-black/10 mt-8">
                <div className="flex items-center gap-6">
                  {article.author_avatar ? (
                    <img src={article.author_avatar} alt={article.author} className="w-16 h-16 rounded-full object-cover border-2 border-black" />
                  ) : (
                    <div className="w-16 h-16 bg-black flex items-center justify-center text-white font-black text-2xl rounded-full">
                      {article.author?.[0]}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="overline-label !text-slate-500 mb-1">Editor Responsable</p>
                    <p className="text-2xl font-black text-black uppercase leading-none tracking-tighter italic">
                      {article.author || 'Redacción Imperio Público'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BARRA LATERAL (SIDEBAR) */}
            <aside className="lg:col-span-4 border-l border-gray-100 lg:pl-12">
              <div className="sticky top-32">
                <h3 className="section-title w-full">Lo más reciente</h3>
                <div className="space-y-8 mt-8">
                  {latest.map((a, idx) => (
                    <Link key={a.id} href={`/articulo/${a.slug}`} className="group flex gap-5 items-start border-b border-slate-50 pb-6 last:border-0">
                      <span className="text-4xl font-black text-slate-100 font-serif group-hover:text-red-600 transition-colors leading-none">{idx + 1}</span>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">{getCategoryBySlug(a.category)?.label}</span>
                        <h5 className="text-[13px] font-black uppercase tracking-tight leading-tight group-hover:underline">{a.title}</h5>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-16">
                   <AdUnit format="rectangle" slot="sidebar-bottom" />
                </div>
              </div>
            </aside>
          </div>

          {/* SECCIÓN "SIGUE LEYENDO" */}
          <section className="mt-20 pt-10 border-t-4 border-black">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-10 italic">Más Noticias Relacionadas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latest.slice(0, 3).map(a => (
                <ArticleCard key={a.id} article={a} variant="medium" className="bg-slate-50 p-6 border border-gray-100" />
              ))}
            </div>
          </section>

          {/* NEWSLETTER FINAL */}
          <div className="mt-20">
             <NewsletterBox />
          </div>
        </div>
      </article>
    </>
  );
}
