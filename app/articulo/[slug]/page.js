// app/articulo/[slug]/page.js — Página de Artículo Premium (PulsoNoticias 2.0)
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getArticleBySlug, getAllArticles, getLatestArticles } from '@/lib/serverData';
import { getCategoryBySlug, formatDate } from '@/lib/data';
import ArticleCard from '@/components/ArticleCard';
import AdUnit from '@/components/AdUnit';

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
      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <nav className="mb-12 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
           <Link href="/" className="hover:text-red-600 transition-colors">Inicio</Link>
           <span className="w-1 h-1 bg-slate-100 rounded-full"></span>
           <Link href={`/categoria/${article.category}`} className="text-red-600">{cat?.label}</Link>
        </nav>
        <header className="mb-16">
           <h1 className="text-5xl md:text-8xl font-black text-black mb-10 leading-none tracking-tighter">
             {article.title}
           </h1>
           <p className="text-xl md:text-3xl text-slate-500 font-serif leading-relaxed mb-12 max-w-4xl italic border-l-8 border-gray-100 pl-8">
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
           <div className="lg:col-span-8">
              <div className="prose-news">
                 {paragraphs.map((p, i) => {
                    if (p.startsWith('## ')) {
                      return <h2 key={i} className="text-3xl font-black text-black mt-16 mb-8 uppercase tracking-tighter italic">{p.replace('## ', '')}</h2>;
                    }
                    const formattedText = p.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-black">$1</strong>');
                    return ( <p key={i} className="mb-10 text-xl font-serif leading-relaxed text-[#333] tracking-normal" dangerouslySetInnerHTML={{ __html: formattedText }} /> );
                 })}
              </div>
              <div className="flex flex-wrap gap-2 mt-20 pt-10 border-t border-gray-100">
                 {article.tags?.map(tag => ( <span key={tag} className="text-[10px] font-black uppercase tracking-[0.3em] bg-slate-50 text-slate-400 px-4 py-2 hover:bg-red-600 hover:text-white transition-all cursor-pointer">#{tag}</span> ))}
              </div>
              <AdUnit format="in-article" className="mt-16" />
           </div>
           <aside className="lg:col-span-4 border-l border-gray-100 pl-0 lg:pl-16">
              <div className="sticky top-32 space-y-20">
                 <div className="bg-white p-0">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-8 pb-3 border-b border-gray-100">Relacionados</h4>
                    <div className="space-y-4"> {related.map(a => ( <ArticleCard key={a.id} article={a} variant="minimal" /> ))} </div>
                 </div>
                 <AdUnit format="rectangle" />
              </div>
           </aside>
        </div>
        <section className="mt-32 pt-20 border-t-8 border-black">
           <h2 className="text-5xl font-black uppercase tracking-tighter mb-16 italic">Sigue Leyendo</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12"> {latest.slice(0, 3).map(a => ( <ArticleCard key={a.id} article={a} variant="medium" /> ))} </div>
        </section>
      </div>
    </article>
  );
}
