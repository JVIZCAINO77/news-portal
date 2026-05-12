/**
 * publish-now.js
 * Publica noticias AHORA usando Pollinations AI (gratis, sin cuota)
 * directamente a Supabase — sin pasar por Vercel.
 * 
 * Uso: node scripts/publish-now.js
 * Uso con categorías: node scripts/publish-now.js noticias politica deportes
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Parser = require('rss-parser');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
});

// ─── CATEGORÍAS CON SUS FEEDS ─────────────────────────────────────────────────
const CATEGORIES = {
  noticias: {
    slug: 'noticias', author: 'Redacción Central', style: 'periodístico objetivo y formal',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/?s=nacional',
      'https://elnacional.com.do/feed/?s=',
    ],
  },
  politica: {
    slug: 'politica', author: 'Mesa Política', style: 'neutral y objetivo',
    feeds: [
      'https://acento.com.do/feed/?s=politica',
      'https://elcaribe.com.do/feed/?s=politica',
      'https://cdn.com.do/feed/?s=politica',
      'https://noticiassin.com/feed/?s=politica',
    ],
  },
  deportes: {
    slug: 'deportes', author: 'Mesa Deportiva', style: 'analítico y pasional',
    feeds: [
      'https://www.diariolibre.com/rss/deportes.xml',
      'https://acento.com.do/feed/?s=deportes',
      'https://elnacional.com.do/feed/?s=deportes',
    ],
  },
  economia: {
    slug: 'economia', author: 'Redacción Económica', style: 'serio y financiero',
    feeds: [
      'https://www.diariolibre.com/rss/economia.xml',
      'https://acento.com.do/feed/?s=economia',
      'https://elcaribe.com.do/feed/?s=economia',
    ],
  },
  sucesos: {
    slug: 'sucesos', author: 'Redacción de Sucesos', style: 'informativo, serio y cauteloso',
    feeds: [
      'https://acento.com.do/feed/?s=sucesos',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/?s=policia',
    ],
  },
  internacional: {
    slug: 'internacional', author: 'Redacción Internacional', style: 'global y analítico',
    feeds: [
      'https://cnnespanol.cnn.com/feed/',
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
    ],
  },
  entretenimiento: {
    slug: 'entretenimiento', author: 'Sección Espectáculos', style: 'dinámico y ameno',
    feeds: [
      'https://www.diariolibre.com/rss/revista.xml',
      'https://remolacha.net/feed/',
      'https://elnacional.com.do/feed/?s=espectaculos',
    ],
  },
  tecnologia: {
    slug: 'tecnologia', author: 'Redacción Tecnológica', style: 'informativo y vanguardista',
    feeds: [
      'https://cnnespanol.cnn.com/feed/',
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
    ],
  },
};

const STOP_WORDS = new Set([
  'el','la','los','las','un','una','de','del','al','a','en','y','e','o','que','por',
  'para','con','sin','sobre','entre','se','le','lo','su','sus','es','son','ha','han',
  'fue','era','ser','estar','tiene','hay','como','pero','mas','ya','si','no','ni',
]);

function extractKeywords(title) {
  if (!title) return new Set();
  const normalized = title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
  return new Set(normalized.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)));
}

function semanticOverlap(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter(k => setB.has(k)).length;
  return intersection / new Set([...setA, ...setB]).size;
}

// ─── GENERADOR DE ARTÍCULO CON POLLINATIONS ──────────────────────────────────
async function generateWithPollinations(cat, news, todayDR) {
  const systemMsg = `Eres un periodista profesional de "Imperio Público", portal de noticias dominicano. 
Siempre respondes ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.`;

  const userMsg = `Escribe un artículo periodístico sobre esta noticia en la sección ${cat.slug.toUpperCase()}:
Titular: ${news.title}
Resumen: ${(news.contentSnippet || '').slice(0, 300)}

El artículo debe tener mínimo 500 palabras en Markdown, con 3 subtítulos (##) y negritas (**dato**).
Estilo: ${cat.style}.

Responde SOLO con este JSON (sin markdown, sin comentarios):
{"title":"titular de 50-70 caracteres","excerpt":"resumen de máximo 150 caracteres","content":"artículo completo en Markdown aquí","tags":["Tag1","Tag2","Tag3"],"impact_level":"high"}`;

  console.log(`    → Generando con Pollinations (openai)...`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg }
        ],
        model: 'openai',
        jsonMode: true,
        seed: Math.floor(Math.random() * 99999),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`Pollinations HTTP ${res.status}`);
    const raw = await res.text();
    return raw;
  } catch (e) {
    clearTimeout(timeoutId);
    throw new Error(`Pollinations falló: ${e.message}`);
  }
}

// ─── INTENTAR CON GEMINI PRIMERO ─────────────────────────────────────────────
async function generateWithGemini(cat, news, todayDR) {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const models = ['gemini-2.0-flash-lite', 'gemini-2.0-flash'];
  
  const prompt = `Eres editor de "Imperio Público", portal de noticias dominicano de élite.

NOTICIA: "${news.title}"
RESUMEN: "${(news.contentSnippet || '').slice(0, 400)}"
SECCIÓN: ${cat.slug.toUpperCase()}
ESTILO: ${cat.style}
FECHA: ${todayDR}

Escribe un artículo periodístico profesional en español con mínimo 500 palabras.
Usa Markdown con 3 subtítulos ## y negritas para datos clave. NO uses frases genéricas de IA.
Si la noticia es trivial o irrelevante, responde exactamente: IRRELEVANTE

Responde SOLO con JSON válido:
{"title":"titular SEO 50-70 chars","excerpt":"resumen 150 chars máximo","content":"artículo Markdown","tags":["Tag1","Tag2","Tag3"],"impact_level":"high"}`;

  for (const key of keys) {
    for (const model of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        });
        const data = await res.json();
        if (data.error) {
          const isQuota = data.error.code === 429 || data.error.status === 'RESOURCE_EXHAUSTED';
          const isInvalid = data.error.code === 400 || data.error.status === 'INVALID_ARGUMENT';
          console.log(`    ⚠️ Gemini ${model} (clave ...${key.slice(-6)}): ${isQuota ? 'cuota agotada' : isInvalid ? 'clave inválida' : data.error.message}`);
          if (isInvalid) break;
          continue;
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          console.log(`    ✅ Gemini ${model} (clave ...${key.slice(-6)}) respondió`);
          return text;
        }
      } catch (e) {
        console.log(`    ❌ Gemini error: ${e.message.slice(0, 60)}`);
      }
    }
  }
  return null; // Todas las claves de Gemini fallaron
}

// ─── PUBLICAR UN ARTÍCULO ─────────────────────────────────────────────────────
async function publishArticle(cat, news, todayDR, publishedLinks, publishedKeywordSets) {
  // Verificar deduplicación
  if (publishedLinks.has(news.link)) {
    return { skipped: true, reason: 'link duplicado' };
  }
  const candidateKws = extractKeywords(news.title);
  if (publishedKeywordSets.some(kws => semanticOverlap(candidateKws, kws) >= 0.35)) {
    return { skipped: true, reason: 'semanticamente duplicado' };
  }

  // Verificar en BD histórica
  const { data: existing } = await supabase.from('articles').select('id').eq('source_link', news.link).maybeSingle();
  if (existing) return { skipped: true, reason: 'link ya en BD' };

  console.log(`  📰 Procesando: "${news.title.slice(0, 70)}"`);

  // Intentar Gemini primero, luego Pollinations
  let rawText = await generateWithGemini(cat, news, todayDR);
  if (!rawText) {
    rawText = await generateWithPollinations(cat, news, todayDR);
  }

  if (!rawText) throw new Error('Ninguna IA respondió');

  // Parsear respuesta
  const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  if (/^irrelevante$/im.test(cleaned)) {
    return { skipped: true, reason: 'IA: noticia irrelevante' };
  }

  let articleData;
  try {
    articleData = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('JSON inválido en respuesta de IA');
    articleData = JSON.parse(match[0]);
  }

  if (!articleData.title || !articleData.content) throw new Error('Campos faltantes en respuesta');

  // ── CANDADO DE LONGITUD MÍNIMA ─────────────────────────────
  if (articleData.content.length < 1200) {
    throw new Error(`[CANDADO] Contenido muy corto: ${articleData.content.length} chars (mínimo 1200).`);
  }

  // ── CANDADO DE ORIGINALIDAD ─────────────────────────────────
  const sourceSnippetLen = (news.contentSnippet || '').length;
  if (sourceSnippetLen > 100 && articleData.content.length < sourceSnippetLen * 3) {
    throw new Error(`[CANDADO] Contenido no reescrito: el artículo es muy similar en longitud al snippet original.`);
  }

  // Verificar que el AI title tenga alguna relación semántica con el titular fuente
  const aiKws = extractKeywords(articleData.title);
  if (aiKws.size > 0 && candidateKws.size > 0 && semanticOverlap(candidateKws, aiKws) === 0) {
    throw new Error('Alucinación: el título generado no tiene relación con la fuente');
  }

  // Construir slug
  const baseSlug = articleData.title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80);
  const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

  // Imagen de Pollinations (IA)
  const topicTags = Array.isArray(articleData.tags) ? articleData.tags.join(', ') : cat.slug;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `high-end editorial news photography for "${articleData.title}". ${topicTags}. Professional journalistic style, cinematic lighting, 8k, realistic, wide shot, 16:9. NO TEXT NO LETTERS.`
  )}?width=1280&height=720&nologo=true&seed=${Date.now()}`;

  // Tags limpios
  let cleanedTags = Array.isArray(articleData.tags)
    ? articleData.tags.map(t => String(t).trim().replace(/^#+/, '')).filter(t => t.length > 0 && t.length < 60)
    : [cat.slug];
  if (cleanedTags.length === 0) cleanedTags = [cat.slug];

  const newArticle = {
    title: articleData.title.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim(),
    slug,
    excerpt: (articleData.excerpt || articleData.title).slice(0, 160),
    content: articleData.content.trim(),
    tags: cleanedTags,
    category: cat.slug,
    author: cat.author,
    image: imageUrl,
    imageAlt: `Imagen para: ${articleData.title}`,
    source_link: news.link,
    publishedAt: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    featured: articleData.impact_level === 'high' || articleData.impact_level === 'medium',
    trending: articleData.impact_level === 'high',
  };

  const { data: inserted, error } = await supabase.from('articles').insert(newArticle).select('id, title').single();
  if (error) throw new Error(`Error BD: ${error.message}`);

  // Actualizar sets de deduplicación para esta sesión
  publishedLinks.add(news.link);
  publishedKeywordSets.push(candidateKws);

  return { success: true, id: inserted.id, title: inserted.title };
}

// ─── PROCESAR UNA CATEGORÍA ───────────────────────────────────────────────────
async function processCategory(catKey) {
  const cat = CATEGORIES[catKey];
  if (!cat) { console.log(`❌ Categoría desconocida: ${catKey}`); return; }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`📂 CATEGORÍA: ${catKey.toUpperCase()}`);
  console.log(`═══════════════════════════════════════`);

  const todayDR = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const startOfToday = new Date(`${todayDR}T00:00:00-04:00`).toISOString();
  const endOfToday = new Date(`${todayDR}T23:59:59-04:00`).toISOString();

  // Verificar límites diarios (Ajustado a 12 globales para AdSense)
  const { count: totalToday } = await supabase.from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);

  if ((totalToday ?? 0) >= 12) {
    console.log(`⛔ Límite global de 12 artículos diarios (seguridad AdSense) alcanzado (${totalToday}). Saliendo.`);
    return;
  }

  const { count: catCount } = await supabase.from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('category', cat.slug)
    .gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);

  if ((catCount ?? 0) >= 2) {
    console.log(`ℹ️ Ya hay ${catCount} artículos de ${catKey} hoy. Saltando.`);
    return;
  }

  // Cargar artículos publicados hoy para deduplicación
  const { data: publishedToday } = await supabase.from('articles')
    .select('source_link, title').gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);

  const publishedLinks = new Set((publishedToday || []).map(a => a.source_link).filter(Boolean));
  const publishedKeywordSets = (publishedToday || []).map(a => extractKeywords(a.title)).filter(s => s.size > 0);

  // Obtener noticias de los feeds
  let pooledItems = [];
  for (const feedUrl of cat.feeds) {
    try {
      const feed = await parser.parseURL(feedUrl);
      pooledItems.push(...(feed.items || []));
    } catch (e) {
      console.log(`  ⚠️ Feed falló (${feedUrl.slice(0, 50)}): ${e.message}`);
    }
  }

  // Filtrar solo noticias de hoy
  const todaysItems = pooledItems.filter(item => {
    const dateStr = item.isoDate || item.pubDate;
    if (!dateStr) return false;
    const itemDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date(dateStr));
    return itemDR === todayDR;
  });

  console.log(`  📡 ${pooledItems.length} items totales → ${todaysItems.length} de hoy (${todayDR})`);

  if (todaysItems.length === 0) {
    console.log(`  ℹ️ Sin noticias de hoy en los feeds de ${catKey}.`);
    return;
  }

  // Publicar 1 artículo por categoría
  let published = 0;
  for (const item of todaysItems) {
    if (!item.link || !item.title) continue;
    if (published >= 1) break; // 1 por categoría en este run

    try {
      const result = await publishArticle(cat, item, todayDR, publishedLinks, publishedKeywordSets);
      if (result.success) {
        console.log(`  ✅ PUBLICADO: "${result.title?.slice(0, 60)}"`);
        published++;
      } else {
        console.log(`  ↷ Omitido (${result.reason}): "${item.title?.slice(0, 50)}"`);
      }
    } catch (err) {
      console.log(`  ❌ Error: ${err.message.slice(0, 100)}`);
    }
  }

  if (published === 0) {
    console.log(`  ⚠️ No se pudo publicar ningún artículo en ${catKey}.`);
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const categoriesToRun = args.length > 0 ? args : Object.keys(CATEGORIES);

  console.log('🚀 Imperio Público — Publicación Manual de Noticias');
  console.log(`📅 ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })}`);
  console.log(`📂 Categorías: ${categoriesToRun.join(', ')}\n`);

  for (const catKey of categoriesToRun) {
    await processCategory(catKey);
    if (categoriesToRun.length > 1) {
      console.log(`\n⏳ Esperando 5 segundos antes de la siguiente categoría...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\n\n🎉 ¡Proceso completado!');
}

main().catch(console.error);
