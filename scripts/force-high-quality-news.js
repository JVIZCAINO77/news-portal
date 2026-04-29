require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenAI } = require("@google/genai");
const Parser = require('rss-parser');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const parser = new Parser();

// Configuración de fuentes y categorías
const SOURCES = [
  { label: 'Noticias', slug: 'noticias', url: 'https://www.diariolibre.com/rss/actualidad.xml', style: 'Informativo y serio' },
  { label: 'Deportes', slug: 'deportes', url: 'https://www.diariolibre.com/rss/deportes.xml', style: 'Enérgico y técnico' },
  { label: 'Economía', slug: 'economia', url: 'https://www.diariolibre.com/rss/economia.xml', style: 'Analítico y formal' }
];

async function publishOne(cat) {
  console.log(`\n🔎 Buscando noticia para ${cat.label}...`);
  
  try {
    const feed = await parser.parseURL(cat.url);
    const items = feed.items.slice(0, 5); // Tomamos las últimas 5 para elegir una
    
    // Filtramos para evitar repetidas (verificación rápida por título en DB)
    let selected = null;
    for (const item of items) {
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .ilike('title', `%${item.title.substring(0, 20)}%`)
        .single();
      
      if (!existing) {
        selected = item;
        break;
      }
    }

    if (!selected) {
      console.log(`⚠️ No se encontraron noticias nuevas en ${cat.label}`);
      return;
    }

    console.log(`📰 Noticia encontrada: ${selected.title}`);

    // Configuración de Gemini
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // EL NUEVO PROMPT MEJORADO
    // ... (rest of the prompt)
    const prompt = `Eres el Editor en Jefe de "Imperio Público", un medio digital de élite reconocido por su profundidad periodística y rigor analítico. Tu misión NO es solo resumir, sino transformar la fuente en un artículo periodístico de alto valor que aporte contexto y análisis original.

--- DATOS DE LA NOTICIA ---
Fecha: ${new Date().toLocaleDateString('es-DO')}
Sección: ${cat.slug.toUpperCase()}
Titular de fuente: ${selected.title}
Resumen de fuente: ${selected.contentSnippet || selected.content || 'Sin resumen disponible'}
--------------------------

REGLAS EDITORIALES CRÍTICAS (MANDATORIAS):
1. IDIOMA: Español neutro y profesional.
2. VALOR AGREGADO (E-E-A-T): 
   - El artículo DEBE incluir un análisis del impacto de la noticia para la sociedad o el sector relacionado.
   - Proporciona contexto histórico o antecedentes si son relevantes para entender el hecho.
3. ESTRUCTURA SEO PREMIUM: 
   - Primer párrafo: Debe enganchar al lector con los datos clave (qué, quién, dónde, cuándo) integrando palabras clave de forma natural.
   - Usa al menos 3 subtítulos (##) analíticos y atractivos.
   - Usa **negritas** para resaltar datos estadísticos, nombres propios y declaraciones clave.
4. TÍTULO (campo "title"): 
   - Debe ser original, potente y optimizado para SEO (50-70 caracteres). 
   - Evita el sensacionalismo barato; busca la autoridad informativa.
5. CONTENIDO (campo "content"):
   - MÍNIMO 550 palabras. Si el resumen es corto, expande con análisis, implicaciones futuras y contexto general del tema.
   - Estilo: ${cat.style}.
   - PROHIBIDO: Frases genéricas de IA como "En el dinámico mundo de hoy", "Es importante destacar", etc.
6. EXCERPT (campo "excerpt"):
   - Meta-descripción perfecta de 155 caracteres que incite al clic por su valor informativo.

Responde EXCLUSIVAMENTE en formato JSON:
{ "title": "...", "excerpt": "...", "content": "...", "tags": ["Tag1", "Tag2"] }`;

    const result = await ai.models.generateContent({
      model: 'gemini-1.5-flash-latest',
      contents: prompt
    });
    
    const text = result.text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(text);

    // Insertar en Supabase
    const { data: inserted, error } = await supabase
      .from('articles')
      .insert([{
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        category: cat.slug,
        author: 'Redacción Imperio Público',
        image: selected.enclosure?.url || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80',
        publishedAt: new Date().toISOString(),
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        tags: data.tags
      }])
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ ¡Publicada con éxito!: ${inserted.title} (${cat.label})`);

  } catch (error) {
    console.error(`❌ Error en ${cat.label}:`, error.message);
  }
}

async function run() {
  console.log("🔥 Iniciando generación de noticias de alta calidad para AdSense...");
  for (const source of SOURCES) {
    await publishOne(source);
    console.log("⏱️ Esperando 10 segundos para el siguiente...");
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log("\n✨ Proceso finalizado. El sitio ahora tiene contenido premium fresco.");
}

run();
