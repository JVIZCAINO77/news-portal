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

  const paragraphs = article.content?.split('\n\n') || [];

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
      <div className="max-w-5xl mx-auto px-6 pt-0 md:pt-4 pb-20 mobile-article-suction">
        <nav className="mb-4 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-muted-base">
           <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
           <span className="w-1 h-px bg-slate-200 w-4"></span>
           <Link href={`/categoria/${article.category}`} className="text-red-600">{cat?.label}</Link>
        </nav>
        <header className="mb-6 relative">
           <h1 style={{ color: '#000000', display: 'block', visibility: 'visible', opacity: 1, fontFamily: '"Playfair Display", Georgia, "Times New Roman", serif' }} className="text-3xl md:text-5xl lg:text-7xl font-black mb-6 leading-[1.0] tracking-[-0.05em]">
              {article.title || 'Información en Desarrollo'}
            </h1>
            {article.excerpt ? (
              <p style={{ color: '#1a1a1a' }} className="text-xl md:text-3xl font-serif leading-[1.4] mb-12 max-w-6xl italic border-l-[12px] border-red-600 pl-12">
                {article.excerpt}
              </p>
            ) : (
              <div className="mb-12 pt-2 border-t border-gray-100 italic font-serif text-slate-500">
                Redacción en proceso. Imperio Público está actualizando esta información.
              </div>
            )}
            <div className="flex flex-col md:flex-row md:items-center justify-between py-16 border-y border-black/10 dark:border-zinc-800 gap-10">
              <div className="flex items-center gap-8">
                {article.author_avatar ? (
                  <img
                    src={article.author_avatar}
                    alt={article.author}
                    className="w-20 h-20 rounded-full object-cover border-4 border-black"
                  />
                ) : (
                  <div className="w-20 h-20 bg-black dark:bg-zinc-800 flex items-center justify-center text-white font-black text-4xl select-none rounded-full">
                    {article.author?.[0]}
                  </div>
                )}
                <div className="text-left">
                  <p className="overline-label !text-slate-500 dark:text-zinc-600 mb-2">Autoría</p>
                  <p className="text-2xl font-black text-black dark:text-white uppercase leading-none tracking-tighter">{article.author || 'Redacción Imperio Público'}</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="overline-label !text-slate-400 dark:text-zinc-600 mb-2">Publicado el</p>
                <div className="flex flex-col md:items-end gap-2">
                  <div className="text-2xl font-black text-foreground uppercase leading-none tracking-tighter">
                    {formatDate(article.publishedAt)}
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 px-3 py-1.5 rounded-full self-start md:self-end">
                    <svg className="w-3 h-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {Math.max(1, Math.ceil((article.content?.split(/\s+/).length || 0) / 200))} min de lectura
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <figure className="mb-24">
            <div className="relative aspect-[16/9] overflow-hidden bg-slate-50">
              <Image src={article.image} alt={article.imageAlt || article.title} fill className="object-cover" priority />
            </div>
            {article.imageAlt && <figcaption className="mt-6 text-center overline-label !text-slate-400">Créditos: {article.imageAlt}</figcaption>}
          </figure>

          <AudioReader title={article.title} text={article.content} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-32">
            {/* Main Content Column */}
            <div className="lg:col-span-8">
              <div className="prose-news">
                {paragraphs.map((p, i) => {
                  if (p.startsWith('## ')) {
                    return <h2 key={i} className="text-4xl md:text-6xl font-black text-black mt-28 mb-16 uppercase tracking-tighter italic border-b-8 border-black inline-block pb-4">{p.replace('## ', '')}</h2>;
                  }
                  if (p.trim() === '---') {
                    return <hr key={i} className="my-24 border-black/10" />;
                  }

                  const formattedText = p
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black">$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em class="italic text-slate-500 font-medium">$1</em>');

                  const isFirstParagraph = i === 0;

                  return (
                    <div key={i}>
                      <p
                        className={`${isFirstParagraph ? 'drop-cap' : ''}`}
                        dangerouslySetInnerHTML={{ __html: formattedText }}
                      />
                      {/* Insert Ad after 2nd paragraph */}
                      {i === 1 && <AdUnit format="in-article" className="my-20" />}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2 mt-20 pt-10 border-t border-border-base">
                {article.tags?.map(tag => (<span key={tag} className="pill-tag text-red-600 border-red-100 hover:border-red-600 uppercase">#{tag}</span>))}
              </div>

              {/* Etiquetas y Newsletter */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 mb-16">
                  {['#Política', '#Economía', '#Impacto', '#Nacional'].map(tag => (
                    <span key={tag} className="pill-tag">
                      {tag}
                    </span>
                  ))}
                </div>

                <NewsletterBox />
              </div>

              <div className="mt-20">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-8 border-b border-gray-100 pb-4 italic">Lo más reciente</h3>
                <div className="space-y-8">
                  {latest.map((a, idx) => (
                    <Link key={a.id} href={`/articulo/${a.slug}`} className="group flex gap-5 items-start">
                      <span className="text-4xl font-black text-slate-100 group-hover:text-red-600 transition-colors leading-none">{idx + 1}</span>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">{getCategoryBySlug(a.category)?.label}</span>
                        <h5 className="text-[13px] font-black uppercase tracking-tight leading-tight group-hover:underline">{a.title}</h5>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Monetization & Engagement */}
            <aside className="lg:col-span-4 border-l border-gray-100 pl-0 lg:pl-16">
              <div className="sticky top-32 space-y-16">
                {/* Sidebar Ad Top */}
                <div className="border-b border-gray-50 pb-16">
                  <AdUnit format="rectangle" slot="sidebar-top" />
                </div>

                {/* Numerical Most Read List */}
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-red-600 mb-8 pb-3 border-b-2 border-red-600 inline-block italic">Lo más leído</h4>
                  <div className="space-y-8">
                    {latest.map((a, idx) => (
                      <Link key={a.id} href={`/articulo/${a.slug}`} className="group flex gap-5 items-start">
                        <span className="text-4xl font-black text-slate-100 group-hover:text-red-600 transition-colors leading-none">{idx + 1}</span>
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2">{getCategoryBySlug(a.category)?.label}</span>
                          <h5 className="text-[13px] font-black uppercase tracking-tight leading-tight group-hover:underline">{a.title}</h5>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Sidebar Ad Bottom */}
                <div className="pt-16 border-t border-gray-50">
                  <AdUnit format="rectangle" slot="sidebar-bottom" />
                </div>
              </div>
            </aside>
          </div>
          <section className="mt-32 pt-20 border-t-8 border-black">
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-16 italic">Sigue Leyendo en {cat?.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {latest.slice(0, 3).map(a => (
                <ArticleCard key={a.id} article={a} variant="medium" className="bg-slate-50/50 p-6" />
              ))}
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
