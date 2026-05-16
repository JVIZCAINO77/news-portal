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

// ── AUTO-POST EN REDES SOCIALES ───────────────────────────────────────────────
// Importación dinámica de ESM (lib/social.js usa export)
async function postToSocialMedia(article) {
  try {
    const { postToSocialMedia: _post } = await import('../lib/social.js');
    await _post(article);
  } catch (e) {
    console.warn('[Social] Error al auto-publicar en RRSS:', e.message);
  }
}

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
  nacional: {
    slug: 'nacional', author: 'Redacción Nacional', style: 'periodístico objetivo y formal',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/',
      'https://elnacional.com.do/feed/',
      'https://acento.com.do/feed/',
      'https://hoy.com.do/feed/',
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
  policia: {
    slug: 'policia', author: 'Sección Policial', style: 'periodístico, policial y formal',
    feeds: [
      'https://www.diariolibre.com/rss/portada.xml',
      'https://almomento.net/feed/',
      'https://noticiassin.com/feed/?s=policia',
      'https://elnacional.com.do/feed/',
      'https://acento.com.do/feed/',
    ],
  },
  deportes: {
    slug: 'deportes', author: 'Mesa Deportiva', style: 'analítico y pasional',
    feeds: [
      'https://www.diariolibre.com/rss/deportes.xml',
      'https://rss.dw.com/xml/rss-es-all',
      'https://cnnespanol.cnn.com/feed/',
      'https://elnacional.com.do/feed/',
    ],
  },
  economia: {
    slug: 'economia', author: 'Redacción Económica', style: 'serio y financiero',
    feeds: [
      'https://www.diariolibre.com/rss/economia.xml',
      'https://rss.dw.com/xml/rss-es-all',
      'https://cnnespanol.cnn.com/feed/',
      'https://elmundo.es/rss/economia.xml',
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
  cultura: {
    slug: 'cultura', author: 'Sección Cultural', style: 'elegante y descriptivo',
    feeds: [
      'https://www.diariolibre.com/rss/revista.xml',
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
      'https://elnacional.com.do/feed/',
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
  salud: {
    slug: 'salud', author: 'Sección de Salud y Bienestar', style: 'profesional e informativo',
    feeds: [
      'https://cnnespanol.cnn.com/feed/',
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
    ],
  },
  'medio-ambiente': {
    slug: 'medio-ambiente', author: 'Sección Medio Ambiente', style: 'informativo y consciente, con enfoque en impacto local e internacional',
    feeds: [
      'https://rss.dw.com/xml/rss-es-all',
      'https://www.bbc.com/mundo/index.xml',
      'https://cnnespanol.cnn.com/feed/',
      'https://acento.com.do/feed/?s=medio+ambiente',
    ],
  },
};

const STOP_WORDS = new Set([
  'el','la','los','las','un','una','de','del','al','a','en','y','e','o','que','por',
  'para','con','sin','sobre','entre','se','le','lo','su','sus','es','son','ha','han',
  'fue','era','ser','estar','tiene','hay','como','pero','mas','ya','si','no','ni',
]);

// Umbral Jaccard: 25% de overlap detecta el mismo evento con distintas palabras
const SEMANTIC_THRESHOLD = 0.25;


/**
 * Stemming básico en español: recorta sufijos comunes para agrupar
 * palabras de la misma raíz (ej: petroleros/petrolera/petróleo → petrole).
 */
function stemWord(word) {
  if (word.length <= 5) return word;
  // Sufijos de mayor a menor (orden importa)
  const suffixes = [
    'aciones','ización','amiento','imientos','amiento',
    'adores','adora','adores','antes','antes',
    'iendo','ando','ación','arios','arias',
    'mente','istas','ista','osos','osas',
    'eros','eras','eros','ismo','ista',
    'ado','ada','ados','adas','ido','ida','idos','idas',
    'ando','iendo','aron','aron',
    'era','ero','ura','ura',
    'es','os','as',
  ];
  for (const s of suffixes) {
    if (word.endsWith(s) && word.length - s.length >= 4) {
      return word.slice(0, word.length - s.length);
    }
  }
  return word;
}

function extractKeywords(title) {
  if (!title) return new Set();
  const normalized = title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').trim();
  return new Set(normalized.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)).map(stemWord));
}

function semanticOverlap(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter(k => setB.has(k)).length;
  return intersection / new Set([...setA, ...setB]).size;
}

/**
 * Extrae entidades (palabras con mayuscula inicial, 4+ chars) del titulo.
 * Detecta el mismo evento aunque cambie la redaccion: "Guyana" aparece en ambos.
 */

// Entidades demasiado genéricas para discriminar eventos (excluidas de la Capa 4)
const GENERIC_ENTITIES = new Set([
  'republica','dominicana','dominicano','dominicanos','dominicanas',
  'estados','unidos','eeuu','america','americana','americana',
  'mundo','pais','paises','gobierno','presidente','nacional',
  'nueva','nuevo','gran','grandes','primer','primera',
  'santo','domingo','santiago','haiti','haitiano',
]);

function extractEntities(title) {
  if (!title) return new Set();
  const entities = new Set();
  for (const w of title.split(/\s+/)) {
    const clean = w.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
    if (clean.length >= 4 && /^[A-ZÁÉÍÓÚÑ]/.test(clean)) {
      const norm = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (!GENERIC_ENTITIES.has(norm)) entities.add(norm);
    }
  }
  return entities;
}

/** Retorna true si 2 titulos comparten 2+ entidades nombradas (mismo evento). */
function sharesCriticalEntities(titleA, titleB) {
  const entA = extractEntities(titleA);
  const entB = extractEntities(titleB);
  if (entA.size === 0 || entB.size === 0) return false;
  return [...entA].filter(e => entB.has(e)).length >= 2;
}

/**
 * Deduplicacion en 4 capas:
 *   1. Link exacto
 *   2. Titulo normalizado exacto
 *   3. Overlap semantico Jaccard >= 25%
 *   4. Entidades nombradas compartidas (2+)
 */
function isAlreadyCovered(title, link, publishedLinks, publishedKeywordSets, publishedTitles) {
  if (publishedLinks.has(link)) return { covered: true, reason: 'link duplicado' };

  const normTitle = (title || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  if (publishedTitles.has(normTitle)) return { covered: true, reason: 'titulo duplicado' };

  const candidateKws = extractKeywords(title);
  if (publishedKeywordSets.some(kws => semanticOverlap(candidateKws, kws) >= SEMANTIC_THRESHOLD))
    return { covered: true, reason: 'duplicado semantico (Jaccard ' + SEMANTIC_THRESHOLD*100 + '%)' };

  if ([...publishedTitles].some(t => sharesCriticalEntities(title, t)))
    return { covered: true, reason: 'mismo evento (entidades compartidas)' };

  return { covered: false };
}

// ─── PROMPT COMPARTIDO ────────────────────────────────────────────────────────
function buildPrompt(cat, news, todayDR) {
  return `Eres editor de "Imperio Público", portal de noticias dominicano de élite.

NOTICIA: "${news.title}"
RESUMEN: "${(news.contentSnippet || '').slice(0, 400)}"
SECCIÓN: ${cat.slug.toUpperCase()}
ESTILO: ${cat.style}
FECHA: ${todayDR}

Escribe un artículo periodístico profesional en español con MÍNIMO 600 palabras.
Usa Markdown con 3 subtítulos ## y negritas para datos clave. NO uses frases genéricas de IA.
Si la noticia es trivial o irrelevante, responde exactamente: IRRELEVANTE

Responde SOLO con JSON válido (sin bloques de código, sin texto extra):
{"title":"titular SEO 50-70 chars","excerpt":"resumen 150 chars máximo","content":"artículo Markdown completo","tags":["Tag1","Tag2","Tag3"],"impact_level":"high"}`;
}

// ─── PROVEEDOR 1: GEMINI ──────────────────────────────────────────────────────
async function generateWithGemini(cat, news, todayDR) {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  // Incluimos todos los modelos Gemini gratuitos disponibles (cuotas independientes)
  const models = [
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
  ];

  const prompt = buildPrompt(cat, news, todayDR);

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
          const isNotFound = data.error.code === 404;
          console.log(`    ⚠️ Gemini ${model} (...${key.slice(-6)}): ${isQuota ? 'cuota agotada' : isInvalid ? 'clave inválida' : isNotFound ? 'modelo no encontrado' : data.error.message}`);
          if (isInvalid) break; // Clave inválida → pasar a siguiente clave
          if (isNotFound) continue; // Modelo no disponible → probar siguiente modelo
          continue;
        }
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (text) {
          console.log(`    ✅ Gemini ${model} (...${key.slice(-6)}) respondió`);
          return text;
        }
      } catch (e) {
        console.log(`    ❌ Gemini error (${model}): ${e.message.slice(0, 60)}`);
      }
    }
  }
  return null;
}

// ─── PROVEEDOR 2: POLLINATIONS AI ────────────────────────────────────────────
async function generateWithPollinations(cat, news, todayDR) {
  const prompt = buildPrompt(cat, news, todayDR);
  const systemMsg = `Eres un periodista profesional de "Imperio Público", portal de noticias dominicano. 
Siempre respondes ÚNICAMENTE con un objeto JSON válido, sin texto adicional, sin bloques de código markdown.`;

  console.log(`    → Intentando Pollinations AI...`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout generoso

  try {
    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: prompt }
        ],
        model: 'openai', // Usar modelo openai que es más estable
        seed: Math.floor(Math.random() * 99999),
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.text();
    if (raw && raw.length > 200) {
      console.log(`    ✅ Pollinations respondió (${raw.length} chars)`);
      return raw;
    }
    throw new Error('Respuesta vacía o muy corta');
  } catch (e) {
    clearTimeout(timeoutId);
    console.log(`    ⚠️ Pollinations falló: ${e.message.slice(0, 60)}`);
    return null;
  }
}

// ─── PROVEEDOR 3: OPENROUTER (modelos gratuitos) ─────────────────────────────
async function generateWithOpenRouter(cat, news, todayDR) {
  // OpenRouter ofrece modelos gratuitos sin necesidad de API key de pago
  // Documentación: https://openrouter.ai/docs/free-models
  const FREE_MODELS = [
    'openai/gpt-oss-120b:free',           // OpenAI OSS 120B — $0, activo
    'openai/gpt-oss-20b:free',            // OpenAI OSS 20B — $0, activo
    'nvidia/nemotron-3-super-120b-a12b:free', // NVIDIA — $0, activo
    'z-ai/glm-4.5-air:free',              // Z.ai GLM — $0, activo
    'minimax/minimax-m2.5:free',          // MiniMax — $0, activo
    'nvidia/nemotron-3-nano-30b-a3b:free', // NVIDIA Nano — $0, activo
  ];

  const prompt = buildPrompt(cat, news, todayDR);

  for (const model of FREE_MODELS) {
    console.log(`    → Intentando OpenRouter (${model.split('/')[1].split(':')[0]})...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
          'HTTP-Referer': 'https://imperiopublico.com',
          'X-Title': 'Imperio Público Bot',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Eres un periodista profesional. Responde ÚNICAMENTE con JSON válido.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText.slice(0, 80)}`);
      }
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      if (text && text.length > 200) {
        console.log(`    ✅ OpenRouter (${model}) respondió`);
        return text;
      }
    } catch (e) {
      clearTimeout(timeoutId);
      console.log(`    ⚠️ OpenRouter (${model}) falló: ${e.message.slice(0, 60)}`);
    }
  }
  return null;
}

// ─── ORQUESTADOR DE IA — prueba todos los proveedores en orden ───────────────
async function generateArticle(cat, news, todayDR) {
  // 1. Gemini (cuota más generosa, prioridad más alta)
  let result = await generateWithGemini(cat, news, todayDR);
  if (result) return result;

  // 2. Pollinations AI (gratuito, sin límite de cuota)
  result = await generateWithPollinations(cat, news, todayDR);
  if (result) return result;

  // 3. OpenRouter modelos gratuitos (última línea de defensa)
  result = await generateWithOpenRouter(cat, news, todayDR);
  if (result) return result;

  // Si todo falló → candado activado
  console.log(`[Bot] 🔒 CANDADO ACTIVADO: todos los proveedores de IA fallaron. Artículo omitido (no publicar sin reescritura real).`);
  throw new Error('Sin IA disponible: Gemini agotado, Pollinations y OpenRouter fallaron. Artículo omitido por política de AdSense estricta.');
}

// ─── INTERNALIZAR IMAGEN A CLOUDINARY ────────────────────────────────────────
/**
 * Descarga imageUrl y la sube a Cloudinary con firma segura.
 * Retorna la URL permanente de Cloudinary, o null si falla.
 * Garantiza que las imágenes NUNCA se rompan para los lectores.
 */
async function uploadToCloudinary(imageUrl, slug) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), 25000);
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*,*/*' },
      signal: controller.signal, redirect: 'follow',
    });
    clearTimeout(timeoutId);
    if (!imgRes.ok) { console.log(`  ⚠️ [Cloudinary] Descarga falló: HTTP ${imgRes.status}`); return null; }
    const ct = imgRes.headers.get('content-type') || 'image/jpeg';
    if (!ct.startsWith('image/')) { console.log(`  ⚠️ [Cloudinary] No es imagen: ${ct}`); return null; }

    const buf    = await imgRes.arrayBuffer();
    const b64    = Buffer.from(buf).toString('base64');
    const ts     = Math.round(Date.now() / 1000);
    const crypto = require('crypto');
    const sig    = crypto.createHash('sha1').update(`folder=imperio-publico/bot&public_id=${slug}&timestamp=${ts}${apiSecret}`).digest('hex');

    const fd = new FormData();
    fd.append('file', `data:${ct};base64,${b64}`);
    fd.append('folder', 'imperio-publico/bot');
    fd.append('public_id', slug);
    fd.append('timestamp', ts.toString());
    fd.append('api_key', apiKey);
    fd.append('signature', sig);
    fd.append('overwrite', 'true');

    const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
    if (!up.ok) { console.log(`  ⚠️ [Cloudinary] Upload falló: ${(await up.text()).slice(0,100)}`); return null; }
    const ud = await up.json();
    console.log(`  ☁️ [Cloudinary] Imagen permanente: ${ud.secure_url}`);
    return ud.secure_url;
  } catch (err) {
    clearTimeout(timeoutId);
    console.log(`  ⚠️ [Cloudinary] Error: ${err.message.slice(0, 80)}`);
    return null;
  }
}

// ─── PUBLICAR UN ARTÍCULO ─────────────────────────────────────────────────────
async function publishArticle(cat, news, todayDR, publishedLinks, publishedKeywordSets, publishedTitles) {
  // ── DEDUPLICACIÓN ESTRICTA (4 capas) ──────────────────────────────────────
  const dupCheck = isAlreadyCovered(news.title, news.link, publishedLinks, publishedKeywordSets, publishedTitles);
  if (dupCheck.covered) {
    return { skipped: true, reason: dupCheck.reason };
  }

  // Verificar en BD histórica
  const { data: existing } = await supabase.from('articles').select('id').eq('source_link', news.link).maybeSingle();
  if (existing) return { skipped: true, reason: 'link ya en BD' };

  console.log(`  📰 Procesando: "${news.title.slice(0, 70)}"`);

  // Intentar con todos los proveedores de IA en orden (Gemini → Pollinations → OpenRouter)
  const rawText = await generateArticle(cat, news, todayDR);

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
    if (match) {
      try { articleData = JSON.parse(match[0]); } catch {}
    }
  }

  // Rescate si el parseo JSON falló (Pollinations AI suele devolver texto en Markdown directo)
  if (!articleData || typeof articleData !== 'object') {
    const lines = cleaned.split('\n');
    let title = news.title;
    if (lines[0] && /^#+\s*/.test(lines[0])) {
      title = lines[0].replace(/^#+\s*/, '').trim();
      lines.shift();
    }
    const content = lines.join('\n').trim();
    if (content.length > 400) {
      articleData = {
        title,
        excerpt: content.slice(0, 155).replace(/\n/g, ' '),
        content,
        tags: [cat.slug],
        impact_level: 'medium'
      };
    } else {
      throw new Error('JSON inválido en respuesta de IA');
    }
  }

  // Mapear traducciones de claves al español que a veces hace la IA
  if (!articleData.title && articleData.titulo) articleData.title = articleData.titulo;
  if (!articleData.content && articleData.contenido) articleData.content = articleData.contenido;
  if (!articleData.excerpt && articleData.resumen) articleData.excerpt = articleData.resumen;

  if (!articleData.title || !articleData.content) throw new Error('Campos faltantes en respuesta');

  // ── CANDADO DE LONGITUD MÍNIMA ─────────────────────────────
  if (articleData.content.length < 1200) {
    throw new Error(`[CANDADO] Contenido muy corto: ${articleData.content.length} chars (mínimo 1200).`);
  }

  // ── CANDADO DE ORIGINALIDAD ─────────────────────────────────
  // Solo aplica si el snippet de origen es corto (≤500 chars).
  // Fuentes como BBC/CNN/DW tienen snippets de 600-900 chars — un artículo de 
  // 600 palabras (≈3600 chars) es genuinamente original aunque no pase 2×snippet.
  const sourceSnippetLen = (news.contentSnippet || '').length;
  if (sourceSnippetLen > 100 && sourceSnippetLen <= 500 && articleData.content.length < sourceSnippetLen * 2) {
    throw new Error(`[CANDADO] Contenido no reescrito: el artículo es muy similar en longitud al snippet original.`);
  }

  // Verificar que el AI title tenga alguna relación semántica con el titular fuente
  const sourceKws = extractKeywords(news.title);
  const aiKws = extractKeywords(articleData.title);
  if (aiKws.size > 0 && sourceKws.size > 0 && semanticOverlap(sourceKws, aiKws) === 0) {
    throw new Error('Alucinación: el título generado no tiene relación con la fuente');
  }

  // Construir slug
  const baseSlug = articleData.title.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').slice(0, 80);
  const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

  // Imagen: genera con Pollinations y la internaliza a Cloudinary de inmediato
  const topicTags = Array.isArray(articleData.tags) ? articleData.tags.join(', ') : cat.slug;
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
    `high-end editorial news photography for "${articleData.title}". ${topicTags}. Professional journalistic style, cinematic lighting, 8k, realistic, wide shot, 16:9. NO TEXT NO LETTERS.`
  )}?width=1280&height=720&nologo=true&seed=${Date.now()}`;
  console.log(`  🖼️  Internalizando imagen a Cloudinary...`);
  const cloudUrl = await uploadToCloudinary(pollinationsUrl, slug);
  const imageUrl = cloudUrl || pollinationsUrl;
  if (!cloudUrl) console.log(`  ℹ️  Cloudinary no disponible — usando Pollinations como fallback.`);

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
    imageAlt: articleData.title,
    source_link: news.link,
    publishedAt: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    featured: articleData.impact_level === 'high' || articleData.impact_level === 'medium',
    trending: articleData.impact_level === 'high',
  };

  const { data: inserted, error } = await supabase.from('articles').insert(newArticle).select('id, title').single();
  if (error) throw new Error(`Error BD: ${error.message}`);

  // Actualizar sets de dedup globales (compartidos entre TODAS las categorias)
  publishedLinks.add(news.link);
  publishedKeywordSets.push(extractKeywords(articleData.title));
  publishedTitles.add((articleData.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim());

  // AUTO-POST en Redes Sociales: DESACTIVADO — publicación manual desde el panel admin.
  // Para activar puntualmente: await postToSocialMedia(newArticle);

  return { success: true, id: inserted.id, title: inserted.title };
}

// ─── PROCESAR UNA CATEGORÍA ───────────────────────────────────────────────────
async function processCategory(catKey, todayDR, startOfToday, endOfToday, publishedLinks, publishedKeywordSets, publishedTitles) {
  const cat = CATEGORIES[catKey];
  if (!cat) { console.log(`❌ Categoría desconocida: ${catKey}`); return; }

  console.log(`\n═══════════════════════════════════════`);
  console.log(`📂 CATEGORÍA: ${catKey.toUpperCase()}`);
  console.log(`═══════════════════════════════════════`);

  // Verificar limites diarios
  const { count: totalToday } = await supabase.from('articles')
    .select('*', { count: 'exact', head: true })
    .gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);

  if ((totalToday ?? 0) >= 12) {
    console.log(`⛔ Limite global de 12 articulos diarios alcanzado (${totalToday}). Saliendo.`);
    return;
  }

  const { count: catCount } = await supabase.from('articles')
    .select('*', { count: 'exact', head: true })
    .eq('category', cat.slug)
    .gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);

  if ((catCount ?? 0) >= 1) {
    console.log(`ℹ️ Ya hay ${catCount} articulo(s) de ${catKey} hoy. Saltando (1 por sección).`);
    return;
  }

  // NOTA: publishedLinks/KeywordSets/Titles vienen como parametros — NO se recargan aqui.
  // Esto garantiza dedup cross-categoria dentro de la misma sesion de ejecucion.

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
      const result = await publishArticle(cat, item, todayDR, publishedLinks, publishedKeywordSets, publishedTitles);
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

  console.log('Imperio Publico - Publicacion Manual de Noticias');
  console.log(new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' }));
  console.log('Categorias: ' + categoriesToRun.join(', ') + '\n');

  // ── ESTADO GLOBAL DE DEDUP ────────────────────────────────────────────────────
  // Se carga UNA SOLA VEZ desde la BD y se comparte entre TODAS las categorias.
  // Si 'sucesos' publica sobre Guyana, 'policia' NO puede publicar el mismo tema.
  const todayDR = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
  const startOfToday = new Date(todayDR + 'T00:00:00-04:00').toISOString();
  const endOfToday   = new Date(todayDR + 'T23:59:59-04:00').toISOString();

  const { data: todayInDB } = await supabase
    .from('articles').select('source_link, title')
    .gte('publishedAt', startOfToday).lte('publishedAt', endOfToday);

  const publishedLinks       = new Set((todayInDB || []).map(a => a.source_link).filter(Boolean));
  const publishedKeywordSets = (todayInDB || []).map(a => extractKeywords(a.title)).filter(s => s.size > 0);
  const publishedTitles      = new Set(
    (todayInDB || []).map(a =>
      (a.title || '').toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim()
    ).filter(Boolean)
  );

  console.log('[DEDUP] Estado inicial: ' +
    publishedLinks.size + ' links | ' +
    publishedKeywordSets.length + ' temas | ' +
    publishedTitles.size + ' titulos ya publicados hoy');

  for (const catKey of categoriesToRun) {
    await processCategory(
      catKey, todayDR, startOfToday, endOfToday,
      publishedLinks, publishedKeywordSets, publishedTitles
    );
    if (categoriesToRun.length > 1) {
      console.log('\nEsperando 5 segundos antes de la siguiente categoria...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('\n\nProceso completado!');
}

main().catch(console.error);
