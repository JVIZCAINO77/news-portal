import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Token secreto para evitar ataques externos, manejado por Vercel
const CRON_SECRET = process.env.CRON_SECRET;

const DR_SOURCES = '(site:listindiario.com OR site:diariolibre.com OR site:elnacional.com.do OR site:eldia.com.do)';

const CATEGORIES = {
  noticias:       { query: `Republica Dominicana noticias ${DR_SOURCES}`,   slug: 'noticias',       author: 'Carlos Mendoza',  style: 'periodístico objetivo y formal' },
  entretenimiento:{ query: `farandula dominicana ${DR_SOURCES}`,            slug: 'entretenimiento', author: 'Valeria Reyes',   style: 'dinámico y ameno' },
  deportes:       { query: `beisbol dominicano ${DR_SOURCES}`,              slug: 'deportes',        author: 'Marcos Alarcón',  style: 'analítico y pasional' },
  tecnologia:     { query: `tecnologia innovacion ${DR_SOURCES}`,           slug: 'tecnologia',      author: 'Elena Torres',    style: 'informativo y vanguardista' },
  economia:       { query: `economia dominicana ${DR_SOURCES}`,             slug: 'economia',        author: 'Roberto Silva',   style: 'serio y financiero' },
  salud:          { query: `salud bienestar medicina republica dominicana ${DR_SOURCES}`, slug: 'salud', author: 'Dr. Arnaldo Pérez', style: 'profesional, informativo y confiable' },
  cultura:        { query: `arte cultura dominicana eventos ${DR_SOURCES}`, slug: 'cultura',        author: 'Sofía Méndez',     style: 'elegante y descriptivo' },
  opinion:        { query: `editorial opinion columnas republica dominicana ${DR_SOURCES}`, slug: 'opinion', author: 'Dr. Héctor Guerrero', style: 'reflexivo, analítico y profundo' },
};

export async function GET(request) {
  // Autenticación — se omite si viene del disparador manual del admin
  const isManualTrigger = request.headers.get('X-Manual-Trigger') === 'true';

  if (!isManualTrigger && CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'No autorizado. Se requiere token CRON.' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const categoryKey = searchParams.get('category') || 'noticias';

  const cat = CATEGORIES[categoryKey];
  if (!cat) {
    return NextResponse.json({ error: `Categoría inválida: ${categoryKey}` }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Verificación del Kill-Switch del Admin
  const { data: botSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'automation_enabled')
    .maybeSingle();

  if (botSetting?.value !== true) {
    return NextResponse.json({ message: 'Automatización pausada desde el panel de administración.' }, { status: 200 });
  }

  try {
    // 2. Extraer Noticias vía Google News RSS
    const parser = new Parser();
    const feedUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cat.query)}&hl=es-419&gl=US&ceid=US:es-419`;
    const feed = await parser.parseURL(feedUrl);

    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({ message: `Sin noticias disponibles para: ${categoryKey}` }, { status: 200 });
    }

    const news = feed.items[0];
    const baseSlug = news.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80);
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // 3. Redacción con Gemini 2.0 Flash (API @google/genai v1.x)
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Actúa como un periodista ético y profesional de "PulsoNoticias". Tienes el siguiente titular y resumen de una noticia real documentada.

Titular original: ${news.title}
Resumen de fuente confiable: ${news.contentSnippet || 'Sin resumen disponible'}

REGLAS ESTRICTAS DE REDACCIÓN:
1. El artículo debe estar COMPLETAMENTE EN ESPAÑOL.
2. VERACIDAD ABSOLUTA: Basate ÚNICAMENTE en los hechos del resumen. NO inventes datos.
3. Aplica tu estilo de periodista: ${cat.style}.
4. Usa formato Markdown en el campo 'content' (## para subtítulos, **negritas** para datos clave).
5. Escribe mínimo 3 párrafos bien desarrollados.
6. Tu respuesta DEBE ser EXCLUSIVAMENTE un JSON válido con este formato exacto (sin bloques de código):
{"title":"Titular impactante en español","excerpt":"Resumen ejecutivo de 2 líneas","content":"Artículo completo en Markdown"}`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    const rawText = aiResponse.text || '';

    // Parseo seguro del JSON
    const cleanedText = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    let articleData;
    try {
      articleData = JSON.parse(cleanedText);
    } catch {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`Respuesta de IA no válida: ${rawText.slice(0, 200)}`);
      articleData = JSON.parse(jsonMatch[0]);
    }

    if (!articleData.title || !articleData.content) {
      throw new Error('La IA no devolvió los campos requeridos (title, content).');
    }

    // 4. Obtener imagen real de la fuente (Scraper ligero)
    let finalImageUrl = null;
    try {
      // Google News redirecciona. Intentamos seguirlo hasta el sitio final.
      const redirectRes = await fetch(news.link, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await redirectRes.text();
      
      // Intentar encontrar og:image
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      
      if (ogImageMatch && ogImageMatch[1]) {
        const foundUrl = ogImageMatch[1];
        
        // --- NUEVO: Verificación de Duplicados (Foto) ---
        // Verificamos si esta URL de imagen ya existe en la base de datos
        const { data: existingPhoto } = await supabase
          .from('articles')
          .select('id')
          .eq('image', foundUrl)
          .maybeSingle();

        if (!existingPhoto) {
          finalImageUrl = foundUrl;
          // Asegurarse de que sea una URL absoluta
          if (finalImageUrl.startsWith('/')) {
            const origin = new URL(redirectRes.url).origin;
            finalImageUrl = `${origin}${finalImageUrl}`;
          }
        } else {
          console.log('[Bot Log] Foto repetida detectada. Activando fallback de IA para exclusividad.');
        }
        // ------------------------------------------------
      }
    } catch (err) {
      console.warn('[Scraper Warning] No se pudo extraer imagen real:', err.message);
    }

    // 5. Fallback a IA si no hay imagen real o si la foto estaba repetida
    if (!finalImageUrl) {
      const imageContext = `Professional photojournalism editorial photography, Dominican Republic news: "${articleData.title}"`;
      finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageContext)}?width=1200&height=630&nologo=true&seed=${Date.now()}`;
    }

    // 6. Guardar en Supabase
    const newArticle = {
      title: articleData.title,
      slug,
      excerpt: articleData.excerpt || articleData.title,
      content: articleData.content,
      category: cat.slug,
      author: cat.author,
      image: finalImageUrl,
      imageAlt: `Imagen para: ${articleData.title}`,
      source_link: news.link, // Guardar el link original
      publishedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      featured: Math.random() > 0.85,
    };

    const { data: insertedArticle, error: insertError } = await supabase
      .from('articles')
      .insert(newArticle)
      .select('id, title')
      .single();

    if (insertError) throw new Error(`Error al guardar en BD: ${insertError.message}`);

    return NextResponse.json({
      success: true,
      message: '¡Noticia redactada, ilustrada y publicada con éxito!',
      article: {
        id: insertedArticle.id,
        title: insertedArticle.title,
        slug,
        category: cat.slug,
        author: cat.author,
      },
    }, { status: 200 });

  } catch (error) {
    console.error(`[Bot Error] Categoría: ${categoryKey} |`, error.message);
    
    // Humanizar el error para el dashboard
    let cleanMessage = error.message;
    if (error.message.includes('Quota exceeded') || error.message.includes('429')) {
      cleanMessage = 'Límite de cuota de IA alcanzado. Por favor, reintenta en unos minutos.';
    } else if (error.message.includes('timeout') || error.message.includes('fetch')) {
      cleanMessage = 'Error de conexión. Reintentando pronto...';
    }

    return NextResponse.json({
      error: cleanMessage,
      category: categoryKey,
      timestamp: new Date().toISOString(),
      raw: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
