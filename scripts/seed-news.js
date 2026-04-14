const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

const articles = [
  {
    title: "Fallece el comunicador Carlos Batista Matos, referente del periodismo de espectáculos",
    slug: "fallece-carlos-batista-matos",
    excerpt: "El fallecimiento del destacado comunicador dominicano Carlos Batista Matos ha generado una profunda consternación en el ámbito mediático y cultural de la República Dominicana.",
    content: "Santo Domingo — La comunicación dominicana se viste de luto con el fallecimiento de Carlos Batista Matos, un ícono del periodismo de espectáculos y la crónica social. Conocido por su estilo único y su larga trayectoria en la televisión nacional, Batista Matos dejó una huella imborrable en varias generaciones de comunicadores. Su partida deja un vacío difícil de llenar en los medios de comunicación del país.",
    category: "noticias",
    image: "/images/news/carlos-batista.png",
    author: "Director General",
    featured: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 mins ago
  },
  {
    title: "Ejecutivos de Univision y Sony Music llegan al país para la premier de Planeta Alofoke",
    slug: "univision-sony-premier-alofoke",
    excerpt: "La expectativa crece en torno a los anuncios que podrían surgir de este encuentro, mientras el público se mantiene atento a las grandes sorpresas prometidas por Santiago Matías.",
    content: "Altos ejecutivos de las gigantes Univision y Sony Music aterrizaron en suelo dominicano para asistir a la exclusiva premier de 'Planeta Alofoke'. Este movimiento estratégico sugiere una expansión masiva del imperio digital de Santiago Matías hacia mercados internacionales, consolidando a la República Dominicana como un hub de contenido digital.",
    category: "entretenimiento",
    image: "/images/news/alofoke-sony.png",
    author: "Director General",
    featured: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    title: "ALERTA ECONÓMICA EN RD ANTE CRISIS INTERNACIONAL",
    slug: "alerta-economica-rd-crisis",
    excerpt: "En medio de un entorno global marcado por la incertidumbre, se encienden las alertas económicas en la República Dominicana ante el impacto potencial de la inflación global.",
    content: "Expertos financieros advierten sobre la necesidad de medidas preventivas ante el volátil panorama económico internacional. La República Dominicana, aunque resiliente, debe prepararse para los desafíos que supone el encarecimiento de materias primas y los cambios en las políticas de reserva federal.",
    category: "tendencias",
    image: "/images/news/alerta-economica.png",
    author: "Director General",
    featured: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    title: "Defensa de Adán Cáceres denuncia 10 fallas que debilitan acusación en Caso Coral",
    slug: "defensa-adan-caceres-fallas-coral",
    excerpt: "El Consejo de Defensa Técnica del mayor general Adán Benoni Cáceres Silvestre aseguró que la acusación del Ministerio Público en el Caso Coral presenta graves inconsistencias.",
    content: "Los abogados defensores presentaron un pliego de objeciones técnicas a la acusación formal, alegando que el proceso ha carecido de rigor probatorio en puntos clave. El Caso Coral continúa siendo uno de los procesos judiciales más seguidos en la historia reciente del país.",
    category: "sucesos",
    image: "/images/news/adan-caceres.png",
    author: "Director General",
    featured: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
  },
  {
    title: "Los astronautas de Artemis II destacan su unión y aprecio por la Tierra entre aplausos",
    slug: "artemis-ii-astronautas-tierra",
    excerpt: "Nueva York. - Los astronautas de Artemis II hicieron sus primeras declaraciones tras regresar sanos y salvos de su histórica misión este sábado, en un acto lleno de emoción.",
    content: "La misión Artemis II marca un hito en la exploración espacial moderna. Los astronautas compartieron sus experiencias sobre la fragilidad de nuestro planeta visto desde el espacio y la importancia de la cooperación internacional para el futuro de la humanidad en las estrellas.",
    category: "tecnologia",
    image: "/images/news/artemis.png",
    author: "Director General",
    featured: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    title: "Renuncias en Agricultura amenazan al sector agropecuario en momentos de crisis global",
    slug: "renuncias-agricultura-crisis-agro",
    excerpt: "Una crisis institucional afecta al Ministerio de Agricultura, en momentos en que la inflación podría generar la irrupción de las cadenas de suministro.",
    content: "La cadena de dimisiones dentro del Ministerio de Agricultura ha encendido las alarmas entre los productores nacionales. Se teme que la falta de mando técnico afecte las proyecciones de cosecha en un año crucial para la seguridad alimentaria del país.",
    category: "economia",
    image: "/images/news/agricultura.png",
    author: "Director General",
    featured: false,
    publishedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    title: "Planeta Alofoke rompe récord histórico con millones en YouTube",
    slug: "planeta-alofoke-record-millonario",
    excerpt: "El innovador proyecto digital ***Planeta Alofoke*** continúa marcando hitos en la comunicación de habla hispana, rompiendo récords de audiencia global.",
    content: "Con una producción de nivel cinematográfico, el estreno de Planeta Alofoke alcanzó cifras de visualizaciones simultáneas nunca antes vistas en un medio digital caribeño, consolidando a Santiago Matías como el líder indiscutible del mercado.",
    category: "noticias",
    image: "/images/news/alofoke-record.png",
    author: "Director General",
    featured: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  },
  {
    title: "COE emite alerta roja para Puerto Plata y zonas del norte ante fuertes lluvias",
    slug: "coe-alerta-roja-norte-lluvias",
    excerpt: "El Centro de Operaciones de Emergencias (COE) declaró en alerta roja a la provincia de Puerto Plata debido a los pronósticos de intensas precipitaciones.",
    content: "Se insta a la población de las zonas bajo alerta a tomar las precauciones necesarias y seguir las instrucciones de los organismos de socorro. Las lluvias podrían continuar durante las próximas 48 horas debido a una vaguada estacionaria.",
    category: "noticias",
    image: "/images/news/coe-alerta.png",
    author: "Director General",
    featured: true,
    publishedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

async function seed() {
  console.log('--- Iniciando Siembra de Noticias ---');
  
  for (const article of articles) {
    const { data, error } = await supabase
      .from('articles')
      .upsert(article, { onConflict: 'slug' });

    if (error) {
      console.error(`Error al insertar ${article.slug}:`, error.message);
    } else {
      console.log(`✓ Insertado/Actualizado: ${article.title}`);
    }
  }

  console.log('--- Siembra Completada ---');
}

seed();
