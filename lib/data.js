// lib/data.js — Capa de datos del portal
// Los artículos se almacenan en un archivo JSON en el servidor (data/articles.json)
// Estas funciones son para leer y procesar los datos

export const SITE_CONFIG = {
  name: 'PulsoNoticias',
  tagline: 'Tu fuente de noticias y entretenimiento',
  description: 'Portal de noticias, entretenimiento, deportes y más. Información actualizada al instante.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://pulsonoticias.com',
  logo: '/logo.png',
  adsenseId: process.env.NEXT_PUBLIC_ADSENSE_ID || 'ca-pub-XXXXXXXXXXXXXXXXX',
  twitterHandle: '@pulsonoticias',
  locale: 'es_ES',
};

export const CATEGORIES = [
  { slug: 'noticias', label: 'Noticias', color: '#e63946', emoji: '📰' },
  { slug: 'entretenimiento', label: 'Entretenimiento', color: '#7b2d8b', emoji: '🎬' },
  { slug: 'deportes', label: 'Deportes', color: '#2a9d8f', emoji: '⚽' },
  { slug: 'tecnologia', label: 'Tecnología', color: '#0077b6', emoji: '💻' },
  { slug: 'opinion', label: 'Opinión', color: '#e76f51', emoji: '💬' },
  { slug: 'cultura', label: 'Cultura', color: '#6a4c93', emoji: '🎨' },
  { slug: 'economia', label: 'Economía', color: '#264653', emoji: '📊' },
  { slug: 'salud', label: 'Salud', color: '#43aa8b', emoji: '🏥' },
];

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((c) => c.slug === slug) || null;
}

// Artículos de muestra iniciales (seed data)
export const SAMPLE_ARTICLES = [
  {
    id: '1',
    slug: 'nueva-era-inteligencia-artificial-2025',
    title: 'La Inteligencia Artificial redefine el futuro del trabajo en 2025',
    excerpt: 'Expertos analizan cómo los modelos de IA generativa están transformando industrias enteras y creando nuevas oportunidades laborales.',
    content: `La transformación digital que estamos viviendo en 2025 es sin precedentes. Los modelos de inteligencia artificial generativa han dejado de ser una curiosidad tecnológica para convertirse en herramientas fundamentales en empresas de todos los sectores.

**El impacto en el mercado laboral**

Según el último informe del Foro Económico Mundial, se estima que la IA creará 97 millones de nuevos empleos para 2025, mientras que automatizará aproximadamente 85 millones de puestos de trabajo actuales. Este balance neto positivo, sin embargo, oculta una realidad compleja de transición y readaptación profesional.

Las profesiones más demandadas incluyen ingenieros de IA, especialistas en datos, diseñadores de experiencia de usuario para sistemas inteligentes y consultores de ética tecnológica.

**¿Qué sectores lideran la adopción?**

El sector financiero ha sido uno de los primeros en adoptar masivamente estas tecnologías, seguido por la salud, la educación y el entretenimiento. Las startups latinoamericanas también están jugando un papel importante en esta revolución.

La clave está en la adaptación continua y en ver la IA como una herramienta de potenciación, no como un reemplazo.`,
    category: 'tecnologia',
    author: 'María González',
    authorBio: 'Periodista especializada en tecnología e innovación',
    image: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80',
    imageAlt: 'Inteligencia artificial y robótica futurista',
    publishedAt: '2025-04-01T10:00:00Z',
    updatedAt: '2025-04-01T10:00:00Z',
    featured: true,
    trending: true,
    tags: ['inteligencia artificial', 'tecnología', 'trabajo', 'innovación'],
    readTime: 5,
    views: 12450,
  },
  {
    id: '2',
    slug: 'copa-america-2025-resultados',
    title: 'Copa América 2025: Los resultados que nadie esperaba en la fase de grupos',
    excerpt: 'La primera jornada de la Copa América 2025 dejó sorpresas mayúsculas. Analizamos los partidos más impactantes.',
    content: `La Copa América 2025 arrancó con todo. La primera jornada de la fase de grupos dejó resultados que pocos analistas anticipaban, y el torneo ya promete ser uno de los más emocionantes de la historia reciente.

**Las grandes sorpresas**

El combinado de Bolivia logró un empate histórico ante Brasil en el estadio del Maracaná, en un partido que mantuvo a millones de aficionados al borde del asiento. Por su parte, Venezuela derrotó por primera vez en su historia a Colombia en un encuentro de grupo de la Copa América.

**Los favoritos y su desempeño**

Argentina, actual campeona del mundo, arrancó con una solvente victoria por 3-0 ante Ecuador, con Julián Álvarez como gran protagonista. Chile, en cambio, decepcionó con un empate ante Perú.

**Lo que viene**

La segunda jornada se perfila aún más intensa. Los favoritos deberán regularizar su rendimiento si quieren llegar a la fase de eliminación directa con opciones reales de título.`,
    category: 'deportes',
    author: 'Carlos Herrera',
    authorBio: 'Analista deportivo con 15 años de experiencia',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    imageAlt: 'Copa América fútbol estadio',
    publishedAt: '2025-04-01T08:30:00Z',
    updatedAt: '2025-04-01T09:00:00Z',
    featured: false,
    trending: true,
    tags: ['copa america', 'fútbol', 'deportes', 'latinoamérica'],
    readTime: 4,
    views: 9870,
  },
  {
    id: '3',
    slug: 'pelicula-oscars-2025-ganadora',
    title: '"Memorias del Ayer" arrasa en los Óscar 2025 con 7 estatuillas',
    excerpt: 'La película latinoamericana se convierte en la gran protagonista de la noche de Hollywood, haciendo historia.',
    content: `La 97ª ceremonia de los Premios de la Academia quedará grabada en la historia del cine latinoamericano. "Memorias del Ayer", la producción dirigida por la cineasta colombiana Andrea Restrepo, se convirtió en la gran triunfadora de la noche al hacerse con siete estatuillas, incluyendo las de Mejor Película y Mejor Directora.

**Una noche histórica**

Por primera vez en la historia de los Premios Óscar, una película hablada íntegramente en español gana el premio a la Mejor Película. La emoción fue palpable en el Dolby Theatre de Los Ángeles, donde buena parte del público se puso en pie.

**El discurso que emocionó al mundo**

Andrea Restrepo, visiblemente emocionada, dedicó el premio a "todos los cineastas latinoamericanos que nos precedieron y que abrieron este camino con su talento y su perseverancia".

La película también se llevó los premios a Mejor Actriz, Mejor Guión Original, Mejor Fotografía, Mejor Banda Sonora y Mejor Diseño de Producción.`,
    category: 'entretenimiento',
    author: 'Sofía Ramírez',
    authorBio: 'Crítica de cine y cultura pop',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    imageAlt: 'Ceremonia de los premios Óscar Hollywood',
    publishedAt: '2025-04-01T07:00:00Z',
    updatedAt: '2025-04-01T07:30:00Z',
    featured: true,
    trending: false,
    tags: ['Óscar', 'cine', 'entretenimiento', 'latinoamérica'],
    readTime: 3,
    views: 15320,
  },
  {
    id: '4',
    slug: 'economia-latinoamerica-crecimiento',
    title: 'Economía latinoamericana: proyecciones optimistas para el segundo semestre',
    excerpt: 'El FMI revisa al alza sus previsiones para América Latina, impulsadas por el auge del sector tecnológico y la inversión extranjera.',
    content: `El Fondo Monetario Internacional (FMI) revisó al alza sus proyecciones de crecimiento para América Latina y el Caribe, elevando la estimación de crecimiento del PIB regional al 3.2% para el año en curso.

**Los motores del crecimiento**

Tres factores son clave en este impulso: el auge del sector tecnológico en países como Colombia, Chile y México; el incremento de la inversión extranjera directa; y la estabilización de los mercados cambiarios en las principales economías de la región.

**País a país**

México lidera las proyecciones con un crecimiento esperado del 3.8%, seguido de Colombia (3.5%) y Perú (3.3%). Brasil, la mayor economía de la región, crece a un ritmo más moderado del 2.7%.

**El desafío de la inflación**

Sin embargo, la inflación sigue siendo una preocupación. Varios países mantienen tasas por encima del 5%, lo que obliga a sus bancos centrales a mantener políticas monetarias restrictivas.`,
    category: 'economia',
    author: 'Roberto Silva',
    authorBio: 'Economista y analista financiero',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    imageAlt: 'Gráficas de economía y finanzas',
    publishedAt: '2025-04-01T06:00:00Z',
    updatedAt: '2025-04-01T06:30:00Z',
    featured: false,
    trending: false,
    tags: ['economía', 'FMI', 'latinoamérica', 'crecimiento'],
    readTime: 4,
    views: 4230,
  },
  {
    id: '5',
    slug: 'salud-dieta-mediterranea-beneficios',
    title: 'Ciencia confirma: la dieta mediterránea reduce un 30% el riesgo cardíaco',
    excerpt: 'Un nuevo estudio con más de 500.000 participantes reafirma los beneficios cardiovasculares de la dieta mediterránea.',
    content: `Un estudio de alcance mundial publicado en la revista New England Journal of Medicine confirma lo que muchos nutricionistas llevan años predicando: la dieta mediterránea reduce significativamente el riesgo de enfermedades cardiovasculares.

**Los hallazgos del estudio**

La investigación, que siguió durante 7 años a más de 500.000 personas en 22 países, encontró que quienes seguían estrictamente una dieta mediterránea tenían un 30% menos de probabilidades de sufrir un infarto o un ictus.

**¿En qué consiste la dieta mediterránea?**

Se basa en el consumo abundante de frutas, verduras, legumbres, cereales integrales, aceite de oliva virgen extra y pescado. Incluye un consumo moderado de derivados lácteos y aves, y limita la carne roja, el azúcar y los alimentos procesados.

**Cómo adoptarla en tu día a día**

Los expertos recomiendan empezar con cambios graduales: sustituir el aceite de girasol por aceite de oliva, aumentar el consumo de legumbres y reducir las carnes procesadas.`,
    category: 'salud',
    author: 'Dra. Carmen López',
    authorBio: 'Médica especialista en nutrición y dietética',
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&q=80',
    imageAlt: 'Alimentos saludables dieta mediterránea',
    publishedAt: '2025-03-31T15:00:00Z',
    updatedAt: '2025-03-31T15:00:00Z',
    featured: false,
    trending: false,
    tags: ['salud', 'nutrición', 'dieta', 'corazón'],
    readTime: 3,
    views: 7890,
  },
  {
    id: '6',
    slug: 'festival-musica-lollapalooza-2025',
    title: 'Lollapalooza 2025: todo lo que necesitas saber antes de ir',
    excerpt: 'Chile vuelve a ser epicentro del rock y la música alternativa. Cartel completo, horarios y consejos para disfrutar al máximo.',
    content: `El Lollapalooza Chile 2025 se celebra este fin de semana en el Parque Bicentenario de Cerrillos, y promete ser la edición más grande de su historia. Con más de 70 artistas en 8 escenarios, el festival atrae a miles de asistentes de toda América Latina.

**Los actos principales**

Billie Eilish, Arctic Monkeys, Bad Bunny y The Weeknd encabezan un cartel cargado de grandes nombres. La presencia latinoamericana también es destacada, con Feid, Bizarrap y Tini entre los más esperados.

**Horarios y escenarios**

El festival se divide en tres días: viernes 4, sábado 5 y domingo 6 de abril. El escenario principal abre a las 14:00 horas y cierra a las 23:00 horas cada día.

**Consejos prácticos**

Llegan temprano para los actos más esperados, lleva protector solar, hidratación suficiente y calzado cómodo. El transporte público es la mejor opción para llegar al recinto.`,
    category: 'entretenimiento',
    author: 'Diego Morales',
    authorBio: 'Periodista musical y de cultura',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    imageAlt: 'Festival de música multitudinario',
    publishedAt: '2025-03-31T12:00:00Z',
    updatedAt: '2025-03-31T12:00:00Z',
    featured: false,
    trending: true,
    tags: ['Lollapalooza', 'música', 'festival', 'Chile'],
    readTime: 3,
    views: 11200,
  },
  {
    id: '7',
    slug: 'elecciones-opinion-democracia',
    title: 'La democracia en tiempos de desinformación: un desafío urgente',
    excerpt: 'La proliferación de fake news y la polarización política amenazan los pilares de la democracia moderna. ¿Qué podemos hacer?',
    content: `En un mundo donde cualquier persona puede publicar contenido que llega a millones de personas en segundos, la democracia enfrenta uno de sus mayores retos históricos: la desinformación masiva.

**El problema en cifras**

Según el Instituto Reuters para el Estudio del Periodismo, el 58% de los ciudadanos de países latinoamericanos afirma haber encontrado noticias falsas al menos una vez a la semana. Este fenómeno tiene consecuencias directas en la participación electoral y la confianza en las instituciones.

**¿Quién tiene la responsabilidad?**

La respuesta no es sencilla. Las plataformas tecnológicas, los medios de comunicación, los políticos y los propios ciudadanos comparten parte de esta responsabilidad. La alfabetización mediática es más urgente que nunca.

**Soluciones desde la sociedad civil**

Organizaciones como Chequeado, Lupa y AFP Factual trabajan incansablemente para verificar la información y combatir los bulos. Su trabajo, aunque fundamental, requiere mayor apoyo institucional y financiero.`,
    category: 'opinion',
    author: 'Prof. Ana Martínez',
    authorBio: 'Politóloga y docente universitaria',
    image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=800&q=80',
    imageAlt: 'Votación democrática urnas',
    publishedAt: '2025-03-31T09:00:00Z',
    updatedAt: '2025-03-31T09:00:00Z',
    featured: false,
    trending: false,
    tags: ['democracia', 'desinformación', 'política', 'opinión'],
    readTime: 5,
    views: 5670,
  },
  {
    id: '8',
    slug: 'arte-urbano-latinoamerica',
    title: 'El arte urbano latinoamericano conquista los museos de Nueva York',
    excerpt: 'Grafiteros y muralistas de México, Colombia y Argentina llevan su obra a las galerías más prestigiosas del mundo.',
    content: `El arte urbano latinoamericano ha dado un salto cualitativo impresionante en los últimos años. Lo que nació en las calles de Bogotá, Ciudad de México y Buenos Aires ahora cuelga en las paredes del MoMA y el Whitney Museum de Nueva York.

**La exposición que lo cambió todo**

"Muros que hablan: Arte Urbano Latinoamericano" es la exposición que ha cambiado la percepción del grafiti y el muralismo en los círculos artísticos más elitistas del mundo. Con obras de más de 40 artistas de 12 países, la muestra ha recibido críticas entusiastas de los principales medios culturales.

**Los artistas que marcan tendencia**

Elian Chali (Argentina), Stinkfish (Colombia) y Smithe (México) son algunos de los nombres que más están sonando en la escena internacional. Sus obras combinan tradición indígena, cultura pop y crítica social de una manera única.

**El mercado del arte urbano**

Las piezas de estos artistas alcanzan precios de decenas de miles de dólares en subastas, un fenómeno que genera debate dentro de la propia comunidad artística sobre la comercialización de un arte que nació como contestación.`,
    category: 'cultura',
    author: 'Valentina Cruz',
    authorBio: 'Crítica de arte y curadora independiente',
    image: 'https://images.unsplash.com/photo-1551913902-c92207136625?w=800&q=80',
    imageAlt: 'Mural de arte urbano colorido',
    publishedAt: '2025-03-30T14:00:00Z',
    updatedAt: '2025-03-30T14:00:00Z',
    featured: false,
    trending: false,
    tags: ['arte urbano', 'cultura', 'latinoamérica', 'museos'],
    readTime: 4,
    views: 3450,
  },
];

export function getArticleBySlug(slug) {
  return SAMPLE_ARTICLES.find((a) => a.slug === slug) || null;
}

export function getArticlesByCategory(category, limit = 10) {
  return SAMPLE_ARTICLES
    .filter((a) => a.category === category)
    .slice(0, limit);
}

export function getFeaturedArticles(limit = 3) {
  return SAMPLE_ARTICLES
    .filter((a) => a.featured)
    .slice(0, limit);
}

export function getTrendingArticles(limit = 5) {
  return SAMPLE_ARTICLES
    .filter((a) => a.trending)
    .slice(0, limit);
}

export function getLatestArticles(limit = 8) {
  return [...SAMPLE_ARTICLES]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, limit);
}

export function getAllArticles() {
  return SAMPLE_ARTICLES;
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-DO', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-DO', {
    timeZone: 'America/Santo_Domingo',
    month: 'short',
    day: 'numeric',
  });
}
