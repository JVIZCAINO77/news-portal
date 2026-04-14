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

  return (
    <article className="bg-white min-h-screen">
      <ReadingProgressBar />
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <nav className="mb-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
           <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
           <span className="w-1 h-1 bg-slate-100 rounded-full"></span>
           <Link href={`/categoria/${article.category}`} className="text-red-600">{cat?.label}</Link>
        </nav>
        <header className="mb-16">
           <h1 className="text-5xl md:text-8xl font-black text-black mb-10 leading-[0.9] tracking-[-0.05em]">
              {article.title}
            </h1>
            <p className="text-xl md:text-3xl text-slate-500 font-serif leading-[1.5] mb-12 max-w-4xl italic border-l-8 border-gray-100 pl-8">
              {article.excerpt}
            </p>
           <div className="flex flex-col md:flex-row md:items-center justify-between py-10 border-y border-gray-100 gap-8">
             <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-black flex items-center justify-center text-white font-black text-2xl select-none">{article.author?.[0]}</div>
                <div className="text-left">
                   <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Autoría</p>
                   <p className="text-lg font-black text-black uppercase leading-none">{article.author}</p>
                </div>
             </div>
             <div className="text-left md:text-right">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Publicado el</p>
                <p className="text-lg font-black text-black uppercase leading-none">{formatDate(article.publishedAt)}</p>
             </div>
           </div>
        </header>
        <figure className="mb-20">
           <div className="relative aspect-[16/9] overflow-hidden grayscale-[0.3] hover:grayscale-0 transition-all duration-700 bg-slate-50">
              <Image src={article.image} alt={article.imageAlt || article.title} fill className="object-cover" priority />
           </div>
           {article.imageAlt && <figcaption className="mt-5 text-center text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] font-sans">Créditos: {article.imageAlt}</figcaption>}
        </figure>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
           {/* Main Content Column */}
           <div className="lg:col-span-8">
              <div className="prose-news">
                 {paragraphs.map((p, i) => {
                    if (p.startsWith('## ')) {
                      return <h2 key={i} className="text-4xl font-black text-black mt-20 mb-10 uppercase tracking-tighter">{p.replace('## ', '')}</h2>;
                    }
                    if (p.trim() === '---') {
                      return <hr key={i} className="my-16 border-slate-100" />;
                    }

                    const formattedText = p
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em class="italic text-slate-500">$1</em>');
                    
                    const isFirstParagraph = i === 0;
                    
                    return ( 
                      <div key={i}>
                         <p 
                           className={`${isFirstParagraph ? 'drop-cap' : ''}`} 
                           dangerouslySetInnerHTML={{ __html: formattedText }} 
                         /> 
                         {/* Insert Ad after 2nd paragraph */}
                         {i === 1 && <AdUnit format="in-article" className="my-12" />}
                      </div>
                    );
                 })}
              </div>
              <div className="flex flex-wrap gap-2 mt-20 pt-10 border-t border-gray-100">
                 {article.tags?.map(tag => ( <span key={tag} className="text-[10px] font-black uppercase tracking-[0.3em] bg-slate-50 text-slate-400 px-4 py-2 hover:bg-red-600 hover:text-white transition-all cursor-pointer">#{tag}</span> ))}
              </div>

              {/* Etiquetas y Newsletter */}
              <div className="mt-12 pt-8 border-t border-gray-100">
                <div className="flex flex-wrap gap-2 mb-16">
                  {['#Política', '#Economía', '#Impacto', '#Nacional'].map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border border-gray-100 italic">
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
  );
}
