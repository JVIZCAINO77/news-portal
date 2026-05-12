require('dotenv').config({ path: '.env.local' });
const { GoogleGenAI } = require('@google/genai');

async function testAI() {
  const cat = { slug: 'noticias', style: 'periodístico objetivo y formal' };
  const news = {
    title: 'Madre de acusado por muerte de Raudiel Martínez revela lo sucedido',
    contentSnippet: 'La madre del joven acusado del homicidio de Raudiel Martínez en San Pedro de Macorís se entregó a las autoridades y declaró...'
  };
  const todayDR = '2026-05-11';

  const prompt = `Eres el editor de la sección "${cat.slug.toUpperCase()}" de "Imperio Público", un medio digital de élite reconocido por su profundidad periodística y rigor analítico.

--- DATOS DE LA NOTICIA ---
Fecha: ${todayDR}
SECCIÓN ASIGNADA (FIJA, NO CAMBIAR): ${cat.slug.toUpperCase()}
Titular de fuente: ${news.title}
Resumen de fuente: ${news.contentSnippet}
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
  console.log("Testing Pollinations AI fallback...");
  try {
     const textUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`;
     const polRes = await fetch(textUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
     rawText = await polRes.text();
     console.log("Response:", rawText);
  } catch (err) {
     console.error("Error from AI:", err);
  }
}

testAI();
