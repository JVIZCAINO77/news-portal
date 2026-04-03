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
  noticias: { 
    query: `Republica Dominicana noticias ${DR_SOURCES}`, slug: 'noticias', emoji: '📰',
    author: 'Carlos Mendoza', authorBio: 'Corresponsal Senior de Actualidad',
    style: 'objetivo, directo, riguroso y al estilo periodístico clásico de la prensa escrita dominicana (como Listín Diario o Diario Libre)'
  },
  entretenimiento: { 
    query: `Republica Dominicana farandula ${DR_SOURCES}`, slug: 'entretenimiento', emoji: '🎬',
    author: 'Valeria Reyes', authorBio: 'Editora de Espectáculos y Cultura',
    style: 'fresco, envolvente, dinámico y conectado con la farándula nacional'
  },
  deportes: { 
    query: `Republica Dominicana beisbol deportes ${DR_SOURCES}`, slug: 'deportes', emoji: '⚽',
    author: 'Marcos Alarcón', authorBio: 'Analista Deportivo',
    style: 'apasionado, rico en contexto estadístico y con narración intensa, como los grandes comentaristas deportivos del país'
  },
  tecnologia: { 
    query: `tecnologia Republica Dominicana ${DR_SOURCES}`, slug: 'tecnologia', emoji: '💻',
    author: 'Elena Torres', authorBio: 'Periodista de Innovación',
    style: 'analítico, vanguardista y fácil de entender para el público general'
  },
  economia: { 
    query: `Republica Dominicana economia ${DR_SOURCES}`, slug: 'economia', emoji: '📈',
    author: 'Roberto Silva', authorBio: 'Analista Financiero',
    style: 'serio, enfocado en el impacto de mercado y en cómo afecta el bolsillo del ciudadano dominicano'
  },
  salud: { 
    query: `Republica Dominicana salud ${DR_SOURCES}`, slug: 'salud', emoji: '🏥',
    author: 'Dra. Carmen López', authorBio: 'Corresponsal Médica',
    style: 'empático, basado estrictamente en ciencia y enfocado en la prevención y el bienestar'
  },
  opinion: { 
    query: `Republica Dominicana editorial opinion ${DR_SOURCES}`, slug: 'opinion', emoji: '💬',
    author: 'Prof. Arturo Peña', authorBio: 'Editorialista Principal',
    style: 'argumentativo, profundo, reflexivo y crítico sobre el contexto sociopolítico actual'
  },
  cultura: { 
    query: `Republica Dominicana cultura arte ${DR_SOURCES}`, slug: 'cultura', emoji: '🎨',
    author: 'Diana Mateo', authorBio: 'Crítica de Arte y Sociedad',
    style: 'culto, descriptivo, poético y enfocado enaltecer las raíces y el talento dominicano'
  }
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

    // Buscamos la primera noticia que NO hayamos publicado
    let rawNews = null;
    for (const item of feed.items) {
      const sourceId = item.guid || item.link;
      // Verificamos en DB si ya existe ese ID oculto en el content
      const { data: existing } = await supabase
        .from('articles')
        .select('id')
        .ilike('content', `%<!-- SOURCE_GUID: ${sourceId} -->%`)
        .limit(1);

      if (!existing || existing.length === 0) {
        rawNews = item;
        break;
      }
    }

    if (!rawNews) {
      throw new Error("No hay noticias nuevas. Todas las recientes de Google News ya fueron publicadas.");
    }

    console.log(`📌 Noticia seleccionada: "${rawNews.title}"`);

    // 2. Usar Gemini para redactar el artículo final (Original y SEO friendly)
    const prompt = `
      Vas a actuar como un periodista profesional altamente reconocido que escribe para el gran portal dominicano "PulsoNoticias".
      
      TU IDENTIDAD PERIODÍSTICA:
      Nombre: ${categoryInfo.author} (${categoryInfo.authorBio})
      Estilo de redacción obligatorio: ${categoryInfo.style}.

      INSTRUCCIÓN:
      Se te dará un titular y un fragmento de una noticia real. Tu trabajo es REESCRIBIR la noticia creando un artículo de prensa original, digno de portales líderes como Listín Diario o Diario Libre.
      - El artículo debe tener entre 3 y 5 párrafos bien desarrollados, introduciendo la noticia, desarrollando el contexto y concluyendo con impacto.
      - Escribe como si fueras TÚ (${categoryInfo.author}) reportándolo de primera mano. Puedes usar en raras ocasiones la primera persona plural ("nosotros los dominicanos") si el contexto lo amerita.
      - MANTÉN LA IMPARCIALIDAD SOBRE HECHOS, pero aplica tu "Estilo de redacción obligatorio".
      - Incluye un Título atractivo y completamente original (jamás copies el original).
      - El contenido debe estar formateado en Markdown, pudiendo usar **negritas**, listas y subtítulos (##) si ayudan a organizar la lectura.
      
      IMPORTANTE: Tu respuesta debe ser SOLO un objeto JSON válido con la siguiente estructura (sin formato de bloque de código markdown fuera del JSON, solo el JSON puro):
      {
        "title": "Un título genial",
        "excerpt": "Un resumen de 2 líneas para atrapar al lector",
        "content": "El contenido formateado en Markdown..."
      }

      NOTICIA ORIGINAL DE REFERENCIA:
      Titular original: ${rawNews.title}
      Resumen original: ${rawNews.contentSnippet || rawNews.content}
    `;

    console.log(`🧠 Solicitando redacción a Gemini AI (Persona: ${categoryInfo.author})...`);
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

    const sourceId = rawNews.guid || rawNews.link;
    const finalContent = articleData.content + `\n\n<!-- SOURCE_GUID: ${sourceId} -->`;

    // Intentar extraer la imagen ORIGINAL en alta resolución de la noticia fuente
    let originalImage = null;
    try {
      console.log(`📸 Extrayendo miniatura original desde el origen...`);
      const res = await fetch(rawNews.link, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(8000)
      });
      const html = await res.text();
      const match = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) || 
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      if (match && match[1]) originalImage = match[1];
    } catch (err) {
      console.log(`⚠️ No se pudo extraer OG Image: ${err.message}`);
    }

    let dynamicImage = `https://picsum.photos/seed/${Date.now().toString()}/1200/630`;

    // Si conseguimos la imagen original, la clonamos y modificamos en Cloudinary para evitar huellas de copyright
    if (originalImage) {
      try {
        console.log(`🎨 Clonando y modificando imagen en Cloudinary para evitar penalizaciones...`);
        const formData = new FormData();
        formData.append('file', originalImage); // Cloudinary permite enviar una URL para que ellos la descarguen
        formData.append('upload_preset', 'news_portal'); // Preset del usuario
        formData.append('folder', 'news-portal/autoblog');

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/DKKW77byz/image/upload`, {
          method: 'POST',
          body: formData
        });

        if (cloudRes.ok) {
          const cloudData = await cloudRes.json();
          // Aplicamos filtros: e_improve (mejora color), e_saturation:10, c_fill,g_auto para garantizar que sea un archivo nuevo a los ojos de Google
          dynamicImage = cloudData.secure_url.replace('/upload/', '/upload/f_auto,q_auto,w_1200,h_630,c_fill,e_improve,e_saturation:10/');
          console.log(`✅ Imagen clonada exitosamente: ${dynamicImage}`);
        } else {
          console.log(`⚠️ Falló el clonado en Cloudinary, usando imagen genérica.`);
        }
      } catch (e) {
        console.log(`⚠️ Error de red con Cloudinary: ${e.message}`);
      }
    }

    const newArticle = {
      id: Date.now().toString(),
      title: articleData.title,
      slug: slug,
      excerpt: articleData.excerpt,
      content: finalContent,
      category: categoryInfo.slug,
      author: categoryInfo.author,
      authorBio: categoryInfo.authorBio,
      image: dynamicImage,
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
    console.error(`❌ Error en Auto-Blogger (${categoryKey}): ${error.message}`);
    // No usar process.exit(1) para que la ejecución local pueda continuar
    // con las catégorías restantes si se encadena externamente.
    return;
  }
}

// Obtener categoría desde la consola, por defecto "tecnologia" si no se envía
const argCategory = process.argv[2] || 'tecnologia';
runAutoBlogger(argCategory);
