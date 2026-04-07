const Parser = require('rss-parser');
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de APIs
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fuentes Dominicaans de confianza
const DR_SOURCES = '(site:listindiario.com OR site:diariolibre.com OR site:elnacional.com.do OR site:eldia.com.do)';

const CATEGORIES = {
  noticias: { query: `Republica Dominicana noticias ${DR_SOURCES}`, slug: 'noticias', author: 'Carlos Mendoza', style: 'periodístico objetivo y formal' },
  entretenimiento: { query: `farandula dominicana ${DR_SOURCES}`, slug: 'entretenimiento', author: 'Valeria Reyes', style: 'dinámico y ameno' },
  deportes: { query: `beisbol dominicano ${DR_SOURCES}`, slug: 'deportes', author: 'Marcos Alarcón', style: 'analítico y pasional' },
  tecnologia: { query: `tecnologia innovacion ${DR_SOURCES}`, slug: 'tecnologia', author: 'Elena Torres', style: 'informativo y vanguardista' },
  economia: { query: `economia dominicana ${DR_SOURCES}`, slug: 'economia', author: 'Roberto Silva', style: 'serio y financiero' },
};

async function runAutoBlogger(categoryKey) {
  // Sincronizar con la base de datos para ver si la automatización está permitida
  const { data: botSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'automation_enabled')
    .maybeSingle();

  const isEnabled = botSetting?.value === true;

  if (!isEnabled) {
    console.log(`⏹️ Automatización PAUSADA desde el Dashboard. Saltando publicación.`);
    return;
  }

  try {
    const cat = CATEGORIES[categoryKey];
    if (!cat) return;

    console.log(`🤖 Buscando noticias para: ${cat.slug}`);
    const parser = new Parser();
    const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${encodeURIComponent(cat.query)}&hl=es-419&gl=US&ceid=US:es-419`);

    if (!feed.items.length) return;

    // Seleccionamos la primera noticia
    const news = feed.items[0];
    const slug = news.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    // Generamos contenido con IA (Gemini)
    const prompt = `Redacta un artículo de prensa original para "PulsoNoticias" sobre: ${news.title}. 
      Resumen: ${news.contentSnippet}. Estilo: ${cat.style}.
      Formato JSON: { "title": "...", "excerpt": "...", "content": "Markdown content..." }`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const articleData = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());

    const newArticle = {
      id: Date.now().toString(),
      title: articleData.title,
      slug: slug,
      excerpt: articleData.excerpt,
      content: articleData.content,
      category: cat.slug,
      author: cat.author,
      image: 'https://images.unsplash.com/photo-1504711331083-9c897949ff59?auto=format&fit=crop&w=1200&h=630&q=80',
      publishedAt: new Date().toISOString(),
      featured: Math.random() > 0.8
    };

    console.log(`💾 Guardando: ${newArticle.title}`);
    await supabase.from('articles').insert(newArticle);
    console.log(`✅ ¡Publicado!`);

  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
  }
}

runAutoBlogger(process.argv[2] || 'noticias');
