// app/articulo/[slug]/page.js — Página de Artículo Premium (Imperio Público 2.0)
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getArticleBySlug, getAllArticles, getLatestArticles } from '@/lib/serverData';
import { getCategoryBySlug, formatDate } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import AdUnit from '@/components/AdUnit';
import NewsletterBox from '@/components/NewsletterBox';
import ReadingProgressBar from '@/components/ReadingProgressBar';
import AudioReader from '@/components/AudioReader';
import SocialShare from '@/components/SocialShare';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Artículo no encontrado' };

  return {
    title: article.title,
    description: article.excerpt,
    keywords: article.tags ? article.tags.sort().join(', ') : '',
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt,
      images: [{ url: article.image }],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) notFound();

  const cat = getCategoryBySlug(article.category);
  const latest = await getLatestArticles(5);
  const related = latest.filter(a => a.id !== article.id).slice(0, 3);

  const paragraphs = article.content?.split('\n\n').filter(p => p.trim() !== "") || [];

  // JSON-LD — Datos Estructurados para Google (NewsArticle)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.image ? [article.image] : [],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: [{
      '@type': 'Person',
      name: article.author,
    }],
    publisher: {
      '@type': 'Organization',
      name: 'Imperio Público',
      logo: {
        '@type': 'ImageObject',
        url: 'https://imperiopublico.com/icon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://imperiopublico.com/articulo/${article.slug}`,
    },
    articleSection: cat?.label || article.category,
    inLanguage: 'es-DO',
    isAccessibleForFree: true,
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
      <div className="max-w-5xl mx-auto px-6 pb-20" style={{ paddingTop: '12px' }}>
        <nav className="mb-[8px] flex items-center justify-end text-[10px] font-black uppercase tracking-[0.3em]">
           {/* FECHA ARRIBA (Parte Roja en la imagen) */}
           <div className="text-slate-500 italic !tracking-normal">
              Publicado el {formatDate(article.publishedAt)}
           </div>
        </nav>

        <header className="mt-0 mb-[10px]">
          <h1 style={{ color: '#000000', display: 'block', opacity: 1, visibility: 'visible', fontSize: '2.5rem', lineHeight: '1.1' }} className="font-black mt-0 mb-0 font-serif tracking-tight">
            {(article.title && article.title.trim() !== "") ? article.title : 'Información en Desarrollo'}
          </h1>
        </header>

        {/* PARTE 2: LA IMAGEN DEL ARTÍCULO (ESTILO PREMIUN UNIFICADO) */}
        <figure className="mb-12 flex justify-center">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-slate-50 shadow-2xl rounded-2xl border border-slate-100 transition-transform hover:scale-[1.01] duration-700">
            <Image 
              src={article.image} 
              alt={article.imageAlt || article.title} 
              fill 
              className="object-cover" 
              priority 
              sizes="(max-width: 1280px) 100vw, 1280px"
            />
          </div>
          {article.imageAlt && <figcaption className="mt-4 text-left overline-label !text-slate-400 italic">Créditos: {article.imageAlt}</figcaption>}
        </figure>

        {/* PARTE 3: EL SUB-TEMA (Excerpt sin borde) */}
        {(article.excerpt && article.excerpt.trim() !== "") ? (
          <div className="mb-[10px]">
            <p style={{ color: '#222222', fontSize: '1rem' }} className="italic font-serif leading-relaxed">
              {article.excerpt}
            </p>
          </div>
        ) : null}

        <AudioReader title={article.title} text={article.content} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
           {/* Main Content Column */}
           <div className="lg:col-span-8 w-full">
            <div className="prose-news">
               {article.content?.trim().startsWith('<') ? (
                  <div 
                    className="article-html-content space-y-6"
                    dangerouslySetInnerHTML={{ __html: article.content }} 
                  />
               ) : (
                  <div className="space-y-6">
                    {paragraphs.map((p, i) => {
                        if (p.trim().match(/^(#[\w-áéíóúñÁÉÍÓÚÑ]+\s*)+$/)) return null;
                        const imgMatch = p.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
                        if (imgMatch) {
                          const alt = imgMatch[1];
                          const src = imgMatch[2];
                          return (
                            <figure key={i} className="my-10 -mx-4 md:-mx-8">
                              <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shadow-xl border border-slate-200">
                                <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
                              </div>
                              {alt && <figcaption className="mt-4 px-4 text-center overline-label !text-slate-400">Figura: {alt}</figcaption>}
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
                            {i === 1 && <AdUnit format="in-article" className="my-12 py-8 border-y border-slate-100" />}
                          </div>
                        );
                    })}
                  </div>
               )}
            </div>

                {/* AUTORÍA (SOLO) EN EL FINAL */}
                <div className="py-8 border-y border-black/10 dark:border-zinc-800 mt-[3px] mb-[3px]">
                  <div className="flex items-center gap-6">
                    {article.author_avatar ? (
                      <img src={article.author_avatar} alt={article.author} className="w-16 h-16 rounded-full object-cover border-2 border-black" />
                    ) : (
                      <div className="w-16 h-16 bg-black dark:bg-zinc-800 flex items-center justify-center text-white font-black text-2xl select-none rounded-full">
                        {article.author?.[0]}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="overline-label !text-slate-500 mb-1">Editor Responsable</p>
                      <p className="text-2xl font-black text-black dark:text-white uppercase leading-none tracking-tighter">{article.author || 'Redacción Imperio Público'}</p>
                    </div>
                  </div>
                </div>
            </div>

            {/* Sidebar Column */}
            <aside className="lg:col-span-4 border-l border-gray-100 pl-0 lg:pl-12">
              <div className="sticky top-32">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-8 border-b border-gray-100 pb-4 italic">Lo más reciente</h3>
                <div className="space-y-8">
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
          
          <section className="mt-32 pt-20 border-t-4 border-black pb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-16 italic">Sigue Leyendo en {cat?.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {latest.slice(0, 3).map(a => (
                <ArticleCard key={a.id} article={a} variant="medium" className="bg-slate-50 p-6 border border-gray-100" />
              ))}
            </div>
          </section>
        </div>

        {/* Full Width Newsletter */}
        <div className="border-t border-gray-100">
           <NewsletterBox />
        </div>
      </article>
    </>
  );
}
