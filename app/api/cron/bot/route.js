import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { internalizeImage } from '@/lib/botUtils';

// Token secreto para evitar ataques externos, manejado por Vercel
const CRON_SECRET = process.env.CRON_SECRET;

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

  const { data: botSetting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'automation_enabled')
    .maybeSingle();

  if (botSetting?.value !== true) {
    return NextResponse.json({ message: 'Automatización pausada desde el panel de administración.' }, { status: 200 });
  }

  try {
    const parser = new Parser({
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
      }
    });
    // --- MEJORA: Consultar múltiples fuentes para encontrar la mejor tendencia ---
    const allSources = [
      'https://acento.com.do/feed/?s=',
      'https://n.com.do/feed/?s=',
      'https://elnacional.com.do/feed/?s=',
      'https://elcaribe.com.do/feed/?s=',
      'https://hoy.com.do/feed/?s=',
      'https://eldia.com.do/feed/?s=',
      'https://z101digital.com/feed/?s=',
      'https://cdn.com.do/feed/?s=',
      'https://noticiassin.com/feed/?s=',
      'https://desenredandodr.com/feed/?s=',
      'https://deultimominuto.net/feed/?s=',
      'https://cnnespanol.cnn.com/feed/',
      'https://www.france24.com/es/rss',
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
      'https://www.rtve.es/api/noticias.rss',
      'https://www.europapress.es/rss/rss.aspx?ch=00066'
    ];

    // Seleccionamos 3 fuentes al azar para mayor diversidad
    const shuffled = [...allSources].sort(() => 0.5 - Math.random());
    const selectedSources = shuffled.slice(0, 3);
    
    let pooledItems = [];
    for (const source of selectedSources) {
      try {
        const feedUrl = source.includes('?s=') 
          ? `${source}${encodeURIComponent(cat.query)}` 
          : source;
        const feed = await parser.parseURL(feedUrl);
        if (feed.items) pooledItems = [...pooledItems, ...feed.items];
      } catch (e) {
        console.error(`[Bot] Error en fuente ${source}:`, e.message);
      }
    }

    if (pooledItems.length === 0) {
      return NextResponse.json({ message: `Sin noticias disponibles en las fuentes para: ${categoryKey}` }, { status: 200 });
    }

    // Ordenar por fecha (las más recientes primero)
    pooledItems.sort((a, b) => {
      const dateA = new Date(a.isoDate || a.pubDate || 0);
      const dateB = new Date(b.isoDate || b.pubDate || 0);
      return dateB - dateA;
    });

    let news = null;
    const now = new Date();
    
    const todayDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);

    console.log(`[Bot] Analizando ${pooledItems.length} noticias para la fecha: ${todayDR}`);

    for (const item of pooledItems) {
      if (!item.link || !item.title) continue;

      // Filtro de fecha estricto: Solo hoy (DR)
      const itemDateStr = item.isoDate || item.pubDate;
      if (itemDateStr) {
        const itemDate = new Date(itemDateStr);
        const itemDR = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Santo_Domingo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(itemDate);

        if (itemDR !== todayDR) continue;
      } else {
        continue;
      }

      // Evitar duplicados
      const { data: existingLink } = await supabase.from('articles').select('id').eq('source_link', item.link).maybeSingle();
      if (existingLink) continue;

      const { data: existingTitle } = await supabase.from('articles').select('id').eq('title', item.title).maybeSingle();
      if (existingTitle) continue;

      news = item;
      break;
    }

    if (!news) {
      return NextResponse.json({ message: `No se encontraron noticias de ALTO IMPACTO hoy (${todayDR}) para: ${categoryKey}` }, { status: 200 });
    }
    const baseSlug = news.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .slice(0, 80);
    const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

    const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
    const selectedKey = keys[Math.floor(Math.random() * keys.length)] || process.env.GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: selectedKey });

    const prompt = `Actúa como un periodista ético y profesional de "Imperio Público". Analiza cuidadosamente esta noticia para la sección "${cat.slug.toUpperCase()}":

Fecha actual: ${todayDR}
Titular original: ${news.title}
Resumen de fuente confiable: ${news.contentSnippet || 'Sin resumen disponible'}

POLÍTICA DE ACTUALIDAD (CERO FICCIÓN/CERO NOTICIAS VIEJAS):
Solo debes procesar esta noticia si es de HOY (${todayDR}) o extremadamente reciente. Si la noticia parece ser de días anteriores o información obsoleta, responde exactamente: IRRELEVANTE

FILTRO ESTRICTO DE CATEGORÍA:
Debes analizar si los hechos de esta noticia realmente encajan perfectamente y sin forzarse en la categoría de "${cat.slug.toUpperCase()}". Si es otro tema, tu ÚNICA RESPUESTA debe ser exactamente la palabra: IRRELEVANTE

Si la noticia sí pertenece estrictamente a "${cat.slug.toUpperCase()}" y es ACTUAL, redacta la nota completa cumpliendo estas REGLAS ESTRICTAS:
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
          const fallbackResponse = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            contents: prompt,
          });
          rawText = fallbackResponse.text || '';
        } catch (superFallbackError) {
           const textUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`;
           const polRes = await fetch(textUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
           rawText = await polRes.text();
        }
      } else {
        throw fallbackError;
      }
    }

    const cleanedText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    if (cleanedText === 'IRRELEVANTE') {
      throw new Error(`La Inteligencia Artificial dictaminó que la noticia encontrada (${news.title}) no pertenece estrictamente a la sección de ${cat.slug.toUpperCase()}.`);
    }

    let articleData;
    try {
      articleData = JSON.parse(cleanedText);
    } catch {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error(`Respuesta de IA no válida`);
      articleData = JSON.parse(jsonMatch[0]);
    }

    if (!articleData.title || !articleData.content) {
      throw new Error('La IA no devolvió los campos requeridos.');
    }

    // LIMPIEZA ESTRICTA: Reemplazar secuencias literales de \n por saltos de línea reales
    const sanitizeAiText = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/\\+n/g, '\n') // Detecta \n, \\n, \\\n etc y los vuelve saltos reales
        .replace(/\\"/g, '"')  
        .replace(/\n\n+/g, '\n\n') // Colapsa múltiples saltos en máximo 2
        .trim();
    };

    const sanitizeContent = (str) => {
      if (typeof str !== 'string') return str;
      return sanitizeAiText(str)
        // Elimina bloque "Etiquetas SEO:" al final del contenido (variantes comunes)
        // NOTA: usamos ancla de fin de string (no 'g') para no borrar ocurrencias internas
        .replace(/\n?[\s\*]*etiquetas\s*(seo)?\s*:.*$/is, '')
        .replace(/\n?[\s\*]*palabras\s*clave\s*:.*$/is, '')
        .replace(/\n?[\s\*]*keywords?\s*:.*$/is, '')
        .trim();
    };

    articleData.title = sanitizeAiText(articleData.title);
    articleData.excerpt = sanitizeAiText(articleData.excerpt);
    articleData.content = sanitizeContent(articleData.content);


    let finalImageUrl = null;
    try {
      const redirectRes = await fetch(news.link, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await redirectRes.text();
      
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || 
                          html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      
      if (ogImageMatch && ogImageMatch[1]) {
        finalImageUrl = ogImageMatch[1];
      } else {
        const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                  html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
        if (twitterImageMatch && twitterImageMatch[1]) {
          finalImageUrl = twitterImageMatch[1];
        } else {
          const anyImageMatch = html.match(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/i);
          if (anyImageMatch && anyImageMatch[1]) {
            finalImageUrl = anyImageMatch[1];
          }
        }
      }

      if (finalImageUrl) {
        if (finalImageUrl.startsWith('//')) {
          finalImageUrl = `https:${finalImageUrl}`;
        } else if (finalImageUrl.startsWith('/')) {
          const origin = new URL(redirectRes.url).origin;
          finalImageUrl = `${origin}${finalImageUrl}`;
        }
        if (finalImageUrl.length < 15 || finalImageUrl.toLowerCase().includes('logo') || finalImageUrl.toLowerCase().includes('icon')) {
          finalImageUrl = null;
        }
      }
    } catch (err) {
      console.warn('[Scraper Warning] No se pudo extraer imagen real:', err.message);
    }

    // MEJORA: Generación de Imagen por IA como Fallback si no se encontró imagen real
    if (!finalImageUrl) {
      console.log(`[Bot] Generando imagen por IA como fallback para: ${articleData.title}`);
      const visualPrompt = `professional editorial news photography, ${articleData.title}, high quality, journalistic style, sharp focus, 16:9 aspect ratio`;
      finalImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(visualPrompt)}?width=1280&height=720&nologo=true&seed=${Date.now()}`;
    }

    if (finalImageUrl) {
      console.log(`[Bot] Internalizando imagen real: ${finalImageUrl.slice(0, 50)}...`);
      finalImageUrl = await internalizeImage(finalImageUrl);
    }

    let sourceName = 'Fuente Externa';
    try {
      const urlObj = new URL(news.link);
      sourceName = urlObj.hostname.replace('www.', '').split('.')[0].toUpperCase();
      const sourceMap = {
        'acento': 'Acento.com.do',
        'n.com.do': 'N Digital (Nuria Piera)',
        'elnacional': 'El Nacional',
        'elcaribe': 'El Caribe',
        'hoy': 'Hoy Digital',
        'eldia': 'El Día',
        'z101digital': 'Z101 Digital',
        'cdn.com.do': 'CDN 37',
        'noticiassin': 'Noticias SIN',
        'desenredandodr': 'Desenredando RD',
        'deultimominuto': 'De Último Minuto',
        'cnnespanol': 'CNN en Español',
        'france24': 'France 24',
        'dw.com': 'Deutsche Welle (DW)',
        'bbc.com': 'BBC Mundo',
        'rtve.es': 'RTVE',
        'europapress.es': 'Europa Press'
      };
      sourceName = sourceMap[sourceName.toLowerCase()] || sourceName;
    } catch (e) { /* ignore */ }

    // Sanitize tags: strip leading # and whitespace, remove empty entries
    let cleanedTags = Array.isArray(articleData.tags)
      ? articleData.tags
          .map(t => String(t).trim().replace(/^#+/, '').replace(/[_\s]+/g, ''))
          .filter(t => t.length > 0 && t.length < 60)
      : [];

    // Fallback: si la IA no devolvió tags, generamos algunos del título + categoría
    if (cleanedTags.length === 0) {
      console.warn('[Bot] IA no devolvió tags. Generando fallback desde título...');
      const titleWords = articleData.title
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar tildes
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .slice(0, 5)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      cleanedTags = [cat.slug.charAt(0).toUpperCase() + cat.slug.slice(1), ...titleWords];
    }

    const newArticle = {
      title: articleData.title,
      slug,
      excerpt: articleData.excerpt || articleData.title,
      content: articleData.content,
      tags: cleanedTags.length > 0 ? cleanedTags : null,
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
      message: '¡Noticia publicada con éxito!',
      article: {
        id: insertedArticle.id,
        title: insertedArticle.title,
        slug,
        category: cat.slug,
      },
    }, { status: 200 });

  } catch (error) {
    console.error(`[Bot Error]`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
