require('dotenv').config({ path: '.env.local' });
const Parser = require('rss-parser');
const { GoogleGenAI } = require('@google/genai');

async function debugBot() {
  const parser = new Parser({ timeout: 5000, headers: { 'User-Agent': 'Mozilla/5.0' } });
  const feeds = ['https://almomento.net/feed/']; // Just one feed to test quickly
  
  const feed = await parser.parseURL(feeds[0]);
  const item = feed.items[0]; // test with the first item

  const cat = { slug: 'noticias', style: 'periodístico objetivo y formal' };
  
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const ai = new GoogleGenAI({ apiKey: keys[0] });

  const prompt = `Eres el editor de la sección "${cat.slug.toUpperCase()}" de "Imperio Público", un medio digital de élite reconocido por su profundidad periodística y rigor analítico.

--- DATOS DE LA NOTICIA ---
Fecha: 2026-05-11
SECCIÓN ASIGNADA (FIJA, NO CAMBIAR): ${cat.slug.toUpperCase()}
Titular de fuente: ${item.title}
Resumen de fuente: ${item.contentSnippet || ''}
--------------------------

REGLAS EDITORIALES CRÍTICAS (MANDATORIAS):
1. SECCIÓN: Tu artículo se publicará EXCLUSIVAMENTE en la sección "${cat.slug.toUpperCase()}". No debes cambiarla. Redacta el contenido enfocado en ese ángulo editorial.
2. IDIOMA: Español neutro y profesional.
3. VALOR AGREGADO (E-E-A-T): 
   - El artículo DEBE incluir un análisis del impacto de la noticia para la sociedad o el sector relacionado.
   - Proporciona contexto histórico o antecedentes si son relevantes para entender el hecho.
4. ESTRUCTURA SEO PREMIUM: 
   - Primer párrafo: Debe enganchar al lector con los datos clave (qué, quién, dónde, cuándo) integrando palabras clave de forma natural.
   - Usa al menos 3 subtítulos (##) analíticos y atractivos.
   - Usa **negritas** para resaltar datos estadísticos, nombres propios y declaraciones clave.
5. TÍTULO (campo "title"): 
   - Debe ser original, potente y optimizado para SEO (50-70 caracteres). 
   - Evita el sensacionalismo barato; busca la autoridad informativa.
6. CONTENIDO (campo "content"):
   - MÍNIMO 550 palabras. Si el resumen es corto, expande con análisis, implicaciones futuras y contexto general del tema.
   - Estilo: ${cat.style}.
   - PROHIBIDO: Frases genéricas de IA como "En el dinámico mundo de hoy", "Es importante destacar", etc.
7. EXCERPT (campo "excerpt"):
   - Meta-descripción perfecta de 155 caracteres que incite al clic por su valor informativo.

PASO 1 — EVALUACIÓN:
- Si la noticia es vieja (>48h), trivial o sin relevancia pública → responde exactamente: IRRELEVANTE.

PASO 2 — FORMATO DE RESPUESTA:
Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido (sin markdown, sin texto adicional):
{ "title": "<titular_autoridad>", "excerpt": "<gancho_informativo>", "content": "<contenido_analitico_extenso_markdown>", "tags": ["Tag1", "Tag2", "Tag3"], "impact_level": "high|medium|low" }`;

  let rawText = '';
  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    rawText = aiResponse.text || '';
    console.log("RawText received:", rawText.slice(0, 100));
  } catch(e) {
    console.error("AI Error:", e);
    return;
  }

  const cleanedText = rawText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  console.log("CleanedText valid JSON check...");
  
  if (/irrelevante/i.test(cleanedText)) {
      console.log("Error: AI marked as IRRELEVANTE");
      return;
  }

  let articleData;
  try {
    articleData = JSON.parse(cleanedText);
    console.log("JSON Parse Success!");
  } catch (parseError) {
    console.log("JSON Parse Failed! Trying Regex extraction...");
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("Error: No JSON format found");
      return;
    }
    try {
      articleData = JSON.parse(jsonMatch[0]);
      console.log("Regex JSON Parse Success!");
    } catch (innerError) {
      console.log("Error: Regex JSON malformed");
      return;
    }
  }

  console.log("Article Title:", articleData.title);
  
  // Detect hallucination
  const sourceKws = new Set(item.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const aiKws = new Set(articleData.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const intersection = [...sourceKws].filter(k => aiKws.has(k)).length;
  console.log("Source Kws:", [...sourceKws]);
  console.log("AI Kws:", [...aiKws]);
  console.log("Intersection:", intersection);
  if (intersection === 0) {
      console.log("Error: Hallucination detected (0% overlap)");
  }
}

debugBot();
