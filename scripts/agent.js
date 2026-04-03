const Parser = require('rss-parser');
const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de APIs
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// IMPORTANTE DE SEGURIDAD: El Agente usa la Service Role Key para saltarse el RLS y escribir en la base de datos de forma segura sin estar logueado.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Filtro estricto de fuentes dominicanas confiables
const DR_SOURCES = '(site:listindiario.com OR site:diariolibre.com OR site:eldia.com.do OR site:elnacional.com.do OR site:somospueblo.com)';

const CATEGORIES = {
  noticias: { query: `Republica Dominicana noticias ${DR_SOURCES}`, slug: 'noticias', emoji: '📰', image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e' },
  entretenimiento: { query: `Republica Dominicana farandula ${DR_SOURCES}`, slug: 'entretenimiento', emoji: '🎬', image: 'https://images.unsplash.com/photo-1603190287605-e6ade32fa852' },
  deportes: { query: `Republica Dominicana beisbol deportes ${DR_SOURCES}`, slug: 'deportes', emoji: '⚽', image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211' },
  tecnologia: { query: `tecnologia Republica Dominicana ${DR_SOURCES}`, slug: 'tecnologia', emoji: '💻', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475' },
  economia: { query: `Republica Dominicana economia ${DR_SOURCES}`, slug: 'economia', emoji: '📈', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3' },
  salud: { query: `Republica Dominicana salud ${DR_SOURCES}`, slug: 'salud', emoji: '🏥', image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528' },
  opinion: { query: `Republica Dominicana editorial opinion ${DR_SOURCES}`, slug: 'opinion', emoji: '💬', image: 'https://images.unsplash.com/photo-1455390582262-044cdead2708' },
  cultura: { query: `Republica Dominicana cultura arte ${DR_SOURCES}`, slug: 'cultura', emoji: '🎨', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b' }
};

async function runAutoBlogger(categoryKey) {
  try {
    const categoryInfo = CATEGORIES[categoryKey];
    if (!categoryInfo) throw new Error(`Categoría desconocida: ${categoryKey}`);

    console.log(`🤖 Iniciando búsqueda para la categoría: ${categoryInfo.slug}`);

    // 1. Obtener noticias recientes de Google News (últimas 24h)
    const parser = new Parser();
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(categoryInfo.query)}%20when:1d&hl=es-419&gl=US&ceid=US:es-419`;
    const feed = await parser.parseURL(rssUrl);

    if (!feed.items || feed.items.length === 0) {
      throw new Error("No se encontraron noticias recientes en Google News.");
    }

    // Tomamos la primera noticia (la más relevante)
    const rawNews = feed.items[0];
    console.log(`📌 Noticia seleccionada: "${rawNews.title}"`);

    // 2. Usar Gemini para redactar el artículo final (Original y SEO friendly)
    const prompt = `
      Vas a actuar como un periodista profesional de "PulsoNoticias".
      Se te dará un titular y un fragmento de una noticia real. Tu trabajo es REESCRIBIR la noticia creando un artículo de prensa completo, profesional, de unos 3-4 párrafos.
      - NO copies el texto original, nárrale a la audiencia los hechos con tus propias palabras.
      - Incluye un Título atractivo (diferente al original).
      - El contenido debe estar formateado en Markdown, pudiendo usar **negritas** y listas si ayudan a la lectura.
      - IMPORTANTE: Tu respuesta debe ser SOLO un objeto JSON válido con la siguiente estructura (sin formato de bloque de código markdown fuera del JSON, solo el JSON puro):
      {
        "title": "Un título genial",
        "excerpt": "Un resumen de 1 línea para atrapar al lector",
        "content": "El contenido formateado en Markdown..."
      }

      NOTICIA ORIGINAL:
      Titular: ${rawNews.title}
      Resumen: ${rawNews.contentSnippet || rawNews.content}
    `;

    console.log(`🧠 Solicitando redacción a Gemini AI...`);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const aiText = response.text.trim().replace(/```json/g, '').replace(/```/g, '');
    const articleData = JSON.parse(aiText);

    // 3. Preparar el registro para Supabase
    const slug = articleData.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Quitar tildes
      .replace(/[^a-z0-9]+/g, '-') // Convertir espacios y símbolos a guiones
      .replace(/(^-|-$)+/g, ''); // Limpiar bordes

    const newArticle = {
      id: Date.now().toString(),
      title: articleData.title,
      slug: slug,
      excerpt: articleData.excerpt,
      content: articleData.content,
      category: categoryInfo.slug,
      author: 'Redacción PulsoNoticias (IA)',
      authorBio: 'Periodismo automatizado a la velocidad de los sucesos.',
      image: categoryInfo.image,
      imageAlt: articleData.title,
      readTime: Math.max(1, Math.ceil(articleData.content.split(' ').length / 200)),
      tags: [categoryInfo.slug],
      featured: false,
      trending: false,
      publishedAt: new Date().toISOString(),
    };

    // 4. Guardar en Supabase
    console.log(`💾 Guardando en Supabase: ${newArticle.slug}...`);
    const { error: dbError } = await supabase.from('articles').insert(newArticle);
    
    if (dbError) throw new Error(`Supabase Error: ${dbError.message}`);

    // 5. Hacer ping (Revalidate) al servidor de Next.js
    console.log(`🌐 Purgando caché de Next.js...`);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const revResponse = await fetch(`${siteUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REVALIDATE_SECRET || 'mi-secreto-super-seguro'}`
      }
    });

    if (!revResponse.ok) console.warn('⚠️ No se pudo purgar la caché. Ignorar si corres el script local.');

    console.log(`✅ ¡Artículo publicado con éxito!`);

  } catch (error) {
    console.error(`❌ Error en Auto-Blogger: ${error.message}`);
    process.exit(1);
  }
}

// Obtener categoría desde la consola, por defecto "tecnologia" si no se envía
const argCategory = process.argv[2] || 'tecnologia';
runAutoBlogger(argCategory);
