import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

// Token secreto para evitar ataques externos, manejado por Vercel
const CRON_SECRET = process.env.CRON_SECRET;

// DR_SOURCES ya no es requerido para Google News, usamos los dominios WP directamente

const CATEGORIES = {
  noticias:       { query: `nacionales`,        slug: 'noticias',       author: 'Redacción Central',  style: 'periodístico objetivo y formal' },
  entretenimiento:{ query: `farandula espectaculos`, slug: 'entretenimiento', author: 'Sección Espectáculos', style: 'dinámico y ameno' },
  deportes:       { query: `deportes beisbol`,  slug: 'deportes',        author: 'Mesa Deportiva',  style: 'analítico y pasional' },
  tecnologia:     { query: `tecnologia`,        slug: 'tecnologia',      author: 'Redacción Tecnológica', style: 'informativo y vanguardista' },
  economia:       { query: `economia`,          slug: 'economia',        author: 'Redacción Económica', style: 'serio y financiero' },
  salud:          { query: `salud medicina`,    slug: 'salud',           author: 'Sección de Salud y Bienestar', style: 'profesional, informativo y confiable' },
  cultura:        { query: `cultura arte`,      slug: 'cultura',         author: 'Sección Cultural', style: 'elegante y descriptivo' },
  opinion:        { query: `opinion editorial`, slug: 'opinion',         author: 'Dirección Editorial', style: 'reflexivo, analítico y profundo' },
  sucesos:        { query: `sucesos policia`,   slug: 'sucesos',         author: 'Redacción de Sucesos', style: 'informativo, serio y cauteloso' },
  tendencias:     { query: `viral redes`,       slug: 'tendencias',      author: 'Mesa de Tendencias', style: 'ágil y moderno' },
  internacional:  { query: `internacional mundo`, slug: 'internacional', author: 'Redacción Internacional', style: 'global y analítico' },
  politica:       { query: `politica`,          slug: 'politica',        author: 'Mesa Política', style: 'neutral y objetivo' },
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
    // 2. Extraer Noticias directamente de los Feeds de WordPress de las fuentes solicitadas
    const parser = new Parser();
    const wpSources = [
      'https://desenredandodr.com/feed/?s=',
      'https://deultimominuto.net/feed/?s='
    ];
    // Elegimos una plataforma de forma aleatoria para esta ejecución
    const selectedSource = wpSources[Math.floor(Math.random() * wpSources.length)];
    const feedUrl = `${selectedSource}${encodeURIComponent(cat.query)}`;
    const feed = await parser.parseURL(feedUrl);

    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({ message: `Sin noticias disponibles para: ${categoryKey}` }, { status: 200 });
    }

    let news = null;
    for (const item of feed.items) {
      if (!item.link) continue;
      
      // Validar si ese link original ya fue subido a la BD
      const { data: existingLink } = await supabase
        .from('articles')
        .select('id')
        .eq('source_link', item.link)
        .maybeSingle();

      // Validar también si el título original ya fue abordado
      const { data: existingTitle } = await supabase
        .from('articles')
        .select('id')
        .eq('title', item.title)
        .maybeSingle();

      if (!existingLink && !existingTitle) {
        news = item; // Encontramos una noticia fresca
        break;
      }
    }

    if (!news) {
      return NextResponse.json({ message: `No hay noticias frescas que no hayan sido publicadas para: ${categoryKey}` }, { status: 200 });
    }
    const baseSlug = news.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80);
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    // 3. Redacción con Inteligencia Artificial (Con Rotación de Keys y Fallback)
    const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    const selectedKey = keys[Math.floor(Math.random() * keys.length)] || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: selectedKey });

    const prompt = `Actúa como un periodista ético y profesional de "Imperio Público". Analiza cuidadosamente esta noticia para la sección "${cat.slug.toUpperCase()}":

Titular original: ${news.title}
Resumen de fuente confiable: ${news.contentSnippet || 'Sin resumen disponible'}

FILTRO ESTRICTO DE CATEGORÍA:
Debes analizar si los hechos de esta noticia realmente encajan perfectamente y sin forzarse en la categoría de "${cat.slug.toUpperCase()}". Si es otro tema (por ejemplo, si envían algo de Política a Tecnología), tu ÚNICA RESPUESTA debe ser exactamente la palabra: IRRELEVANTE

Si la noticia sí pertenece estrictamente a "${cat.slug.toUpperCase()}", ignora el filtro anterior y redacta la nota completa cumpliendo estas REGLAS ESTRICTAS:
1. El artículo debe estar COMPLETAMENTE EN ESPAÑOL.
2. VERACIDAD ABSOLUTA: Basate ÚNICAMENTE en los hechos del resumen. NO inventes datos.
3. Aplica tu estilo de periodista: ${cat.style}.
4. EL TITULAR DEBE SER MUY LLAMATIVO Y MAGNÉTICO: Reformula el titular original para que capte la atención del lector de inmediato. Usa mayúsculas solo para nombres propios o al inicio; PROHIBIDO escribir el titular o partes de él en mayúsculas sostenidas.
5. Usa formato Markdown en el campo 'content' (## para subtítulos, **negritas** para datos clave).
6. PROHIBIDO: No uses hashtags (#) ni guiones bajos (_) en el texto ni en las etiquetas.
7. Escribe mínimo 3 párrafos bien desarrollados.
8. Extrae de 3 a 5 palabras clave de alto tráfico SEO (SEO Tags) enfocadas en este tema y devuélvelas en un arreglo de strings (SIN el símbolo #).
9. Tu respuesta DEBE ser EXCLUSIVAMENTE un JSON válido con este formato exacto (sin bloques de código):
{"title":"TITULAR LLAMATIVO Y MAGNÉTICO AQUÍ","excerpt":"Resumen en forma de 'gancho' para mantener la retención","content":"Artículo completo en Markdown","tags":["seo1", "seo2", "seo3"]}`;

    let rawText = '';
    try {
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      rawText = aiResponse.text || '';
    } catch (fallbackError) {
      if (fallbackError.message.includes('Quota') || fallbackError.message.includes('429')) {
        try {
          console.warn(`[Bot Warning] Cuota de gemini-2.0-flash excedida. Probando gemini-2.0-flash-lite...`);
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt,
          });
          rawText = fallbackResponse.text || '';
        } catch (superFallbackError) {
           console.warn(`[Bot Critical] Todos los modelos de Gemini agotados. Rescatando con IA Pollinations (Ilimitada)...`);
           const textUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`;
           const polRes = await fetch(textUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
           rawText = await polRes.text();
        }
      } else {
        throw fallbackError;
      }
    }

    // Parseo seguro del JSON
    const cleanedText = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    // Filtro de irrelevancia emitido por la IA
    if (cleanedText === 'IRRELEVANTE') {
      throw new Error(`La Inteligencia Artificial dictaminó que la noticia encontrada (${news.title}) no pertenece estrictamente a la sección de ${cat.slug.toUpperCase()}. Se omite para evitar desorden.`);
    }

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
        
        // Evitaremos logos genéricos o imágenes dañadas en el caso de que la URL esté rota
        if (foundUrl.length > 10) {
          finalImageUrl = foundUrl;
        }
        // Asegurarse de que sea una URL absoluta
        if (finalImageUrl.startsWith('/')) {
          const origin = new URL(redirectRes.url).origin;
          finalImageUrl = `${origin}${finalImageUrl}`;
        }
      }
    } catch (err) {
      console.warn('[Scraper Warning] No se pudo extraer imagen real:', err.message);
    }

    // 5. Fallback a IA si no hay imagen real o si la foto estaba repetida
    if (!finalImageUrl) {
      const imageContext = `Professional photojournalism editorial photography, Dominican Republic news: "${articleData.title}"`;
      finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(imageContext)}?width=1200&height=630&nologo=true&seed=${Date.now()}`;
    }

    // --- NUEVO: Extraer nombre de la fuente ---
    let sourceName = 'Fuente Externa';
    try {
      const urlObj = new URL(news.link);
      sourceName = urlObj.hostname.replace('www.', '').split('.')[0].toUpperCase();
      // Mapeo amigable para los medios asignados
      const sourceMap = {
        'desenredandodr': 'Desenredando RD',
        'deultimominuto': 'De Último Minuto',
        'noticiaslatam': 'Noticias Latam'
      };
      sourceName = sourceMap[sourceName.toLowerCase()] || sourceName;
    } catch (e) { /* ignore */ }

    // Preparar el cuerpo del artículo con las etiquetas inyectadas al final de la nota (para que sea robusto en DB)
    const injectedTagsList = (articleData.tags && articleData.tags.length > 0)
      ? `\n\n**Etiquetas SEO:** ${articleData.tags.map(t => t.trim().replace(/^#/, '').replace(/\s+/g,'')).join(', ')}`
      : '';

    // 6. Guardar en Supabase
    const newArticle = {
      title: articleData.title,
      slug,
      excerpt: articleData.excerpt || articleData.title,
      content: `${articleData.content}\n\n---\n*Fuente original: ${sourceName}*${injectedTagsList}`, 
      category: cat.slug,
      author: cat.author,
      image: finalImageUrl,
      imageAlt: `Imagen para: ${articleData.title}`,
      source_link: news.link, 
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
