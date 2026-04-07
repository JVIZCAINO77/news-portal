import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Token secreto para evitar ataques externos, manejado por Vercel
const CRON_SECRET = process.env.CRON_SECRET;

const DR_SOURCES = '(site:listindiario.com OR site:diariolibre.com OR site:elnacional.com.do OR site:eldia.com.do)';

const CATEGORIES = {
  noticias: { query: `Republica Dominicana noticias ${DR_SOURCES}`, slug: 'noticias', author: 'Carlos Mendoza', style: 'periodístico objetivo y formal' },
  entretenimiento: { query: `farandula dominicana ${DR_SOURCES}`, slug: 'entretenimiento', author: 'Valeria Reyes', style: 'dinámico y ameno' },
  deportes: { query: `beisbol dominicano ${DR_SOURCES}`, slug: 'deportes', author: 'Marcos Alarcón', style: 'analítico y pasional' },
  tecnologia: { query: `tecnologia innovacion ${DR_SOURCES}`, slug: 'tecnologia', author: 'Elena Torres', style: 'informativo y vanguardista' },
  economia: { query: `economia dominicana ${DR_SOURCES}`, slug: 'economia', author: 'Roberto Silva', style: 'serio y financiero' },
};

export async function GET(request) {
  // Autenticación de la ruta para que solo Vercel pueda invocarla
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado. Se requiere token CRON.' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const categoryKey = searchParams.get('category') || 'noticias';

  const cat = CATEGORIES[categoryKey];
  if (!cat) {
    return NextResponse.json({ error: 'Categoría de noticia inválida' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Verificación del Interruptor "Kill-Switch" del Admin
  const { data: botSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'automation_enabled')
    .maybeSingle();

  if (botSetting?.value !== true) {
    return NextResponse.json({ message: 'Automatización pausada desde el panel' }, { status: 200 });
  }

  try {
    // 2. Extraer Noticias Reales de República Dominicana
    const parser = new Parser();
    const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${encodeURIComponent(cat.query)}&hl=es-419&gl=US&ceid=US:es-419`);

    if (!feed.items.length) {
      return NextResponse.json({ message: 'No hay fuentes de noticias actualizadas hoy para esta categoría.' }, { status: 200 });
    }

    const news = feed.items[0]; // Noticia más relevante del día
    // Hacemos el slug super único para evitar choques en la BD
    const slug = news.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4);

    // 3. IA de Redacción (Estrictamente Español y 100% Cierto)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `Actúa como un periodista ético y profesional de "PulsoNoticias". Tienes el siguiente titular y resumen de una noticia real documentada.

Titular original: ${news.title}
Resumen de fuente confiable: ${news.contentSnippet}

REGLAS ESTRICTAS DE REDACCIÓN:
1. El artículo debe estar COMPLETAMENTE EN ESPAÑOL.
2. VERACIDAD ABSOLUTA: BASATE ÚNICAMENTE en los hechos documentados en el resumen. NO INVENTES fechas, ni estadísticas, ni nombres que no estén ahí. Si la información es corta, escribe un artículo breve pero 100% fiel a los hechos reales sin especular.
3. Aplica tu estilo de periodista: ${cat.style}.
4. Utiliza el formato Markdown válido para darle estilo profesional al campo 'content' (usa ## para subtítulos o **negritas** para enfatizar partes importantes).
5. Tu respuesta DEBE ser EXCLUSIVAMENTE este formato JSON válido: { "title": "Nuevo titular impactante de la misma noticia", "excerpt": "Un resumen ejecutivo enganchante de 2 lineas", "content": "El artículo en Markdown con varios párrafos" }`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    
    // Parseo seguro del JSON
    const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const articleData = JSON.parse(rawText.replace(/```json/g, '').replace(/```/g, '').trim());

    // 4. IA para Imágenes Dinámicas en Base al Contexto (Vía Pollinations API)
    // Pedimos el prompt preferiblemente en inglés para mejor comprensión del motor visual
    const imageContext = `Professional photojournalism, realistic newspaper editorial photography, capturing the main essence and event of this news: "${articleData.title}"`;
    const dynamicImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageContext)}?width=1200&height=630&nologo=true`;

    // 5. Compilar todo y Guardar en la Base de Datos
    const newArticle = {
      id: Date.now().toString(),
      title: articleData.title,
      slug: slug,
      excerpt: articleData.excerpt,
      content: articleData.content,
      category: cat.slug,
      author: cat.author,
      image: dynamicImageUrl, // La imagen de IA
      "imageAlt": "Generado dinámicamente con Inteligencia Artificial Visual",
      publishedAt: new Date().toISOString(),
      featured: Math.random() > 0.8 // 20% de probabilidad de ser Hero principal
    };

    const { error: insertError } = await supabase.from('articles').insert(newArticle);

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ 
      message: '¡Noticia redactada, ilustrada y publicada con éxito!', 
      article: newArticle.title,
      image_source: dynamicImageUrl 
    }, { status: 200 });

  } catch (error) {
    console.error('Error Crítico en Robot Editorial:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
