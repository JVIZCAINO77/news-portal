import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ─── REGLAS DE CLASIFICACIÓN ─────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  deportes:        ['deporte','béisbol','beisbol','fútbol','futbol','baloncesto','nba','mlb','pelotero','atleta','jugador','equipo','partido','torneo','campeonato','liga','gol','jonrón','jonron','pitcher','cancha','estadio','boxeo','tenis','ciclismo','medalla','olímpico','mundial','nfl','mls'],
  economia:        ['economía','economia','económico','financiero','pib','inflación','inflacion','banco','dólar','dolar','mercado','inversión','inversion','empresa','comercio','impuesto','presupuesto','exportación','importación','precio','deficit','reservas','bolsa','deuda','aranceles','desempleo','empleo','crecimiento'],
  politica:        ['política','politica','político','gobierno','presidente','ministro','diputado','senador','partido','elecciones','congreso','decreto','reforma','alcalde','gabinete','ejecutivo','legislativo','campaña','voto','candidato','senado','cámara'],
  salud:           ['salud','médico','medico','hospital','enfermedad','vacuna','tratamiento','paciente','clínica','medicina','virus','pandemia','cáncer','cancer','diabetes','bienestar','prevención','nutrición','epidemia','sanitario','cirugía','farmaco'],
  entretenimiento: ['espectáculo','espectaculo','farandula','actor','actriz','cantante','pelicula','película','serie','concierto','artista','música','musica','teatro','show','celebridad','estreno','nominación','premio','reggaeton','bachata','merengue','influencer'],
  cultura:         ['cultura','arte','museo','exposición','patrimonio','literatura','libro','autor','escritor','festival','danza','folclore','tradición','gastronomía','arquitectura','identidad','artesanía'],
  tecnologia:      ['tecnología','tecnologia','inteligencia artificial','ia','robot','app','software','hardware','digital','internet','ciberseguridad','startup','innovación','samsung','apple','google','meta','openai','computadora','smartphone','chatgpt','drone'],
  sucesos:         ['detenido','arrestado','capturado','homicidio','asesinado','robo','accidente','incendio','crimen','policía','policia','autoridades','investigación','víctima','sospechoso','fugitivo','delito','herido','muerto','matan','secuestro'],
  tendencias:      ['viral','tendencia','redes sociales','tiktok','instagram','twitter','youtube','influencer','meme','trending','popular','hashtag'],
  internacional:   ['internacional','mundial','eeuu','estados unidos','europa','china','rusia','latinoamérica','onu','biden','trump','guerra','conflicto','diplomacia','cumbre','tratado','global','extranjero','migración'],
  policia:         ['policía nacional','pn','dncd','dicrim','fiscalía','fiscalia','tribunal','juez','fiscal','justicia','cárcel','carcel','preso','condena','arresto','operativo','banda','narco','crimen organizado','denuncia','abogado'],
  noticias:        [],
};

const CATEGORY_BLOCKLIST = {
  deportes:        ['homicidio','asesinado','inflacion','pib','ministro de'],
  economia:        ['beisbol','jonron','mlb','nba','actor','actriz','cantante','farandula','gol'],
  politica:        ['beisbol','jonron','mlb','nba','actor','actriz','cantante','farandula'],
  salud:           ['beisbol','jonron','mlb','presidente abinader','partido politico'],
  entretenimiento: ['presidente abinader','ministro de','pib','inflacion','banco central','homicidio'],
  cultura:         ['beisbol','jonron','mlb','nba','pib','inflacion','banco central','homicidio'],
  tecnologia:      ['homicidio','asesinado','beisbol'],
  sucesos:         ['actor','actriz','cantante','concierto','beisbol','jonron','mlb','nba','pib','inflacion'],
  tendencias:      ['pib','inflacion','banco central','reforma constitucional','homicidio'],
  internacional:   ['presidente abinader','senado dominicano','camara de diputados','ayuntamiento de'],
  policia:         ['actor','actriz','cantante','concierto','beisbol','jonron','mlb','nba','pib'],
  noticias:        [],
};

function normalize(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectBestCategory(article) {
  const text = normalize(`${article.title} ${article.excerpt || ''} ${(article.tags || []).join(' ')}`);
  const scores = {};

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'noticias') continue;
    const blocked = (CATEGORY_BLOCKLIST[cat] || []).some(w => text.includes(normalize(w)));
    if (blocked) { scores[cat] = -1; continue; }
    scores[cat] = keywords.filter(kw => text.includes(normalize(kw))).length;
  }

  const ranked = Object.entries(scores).filter(([, s]) => s > 0).sort(([, a], [, b]) => b - a);
  return ranked.length > 0 ? ranked[0][0] : null; // null = no reclasificar
}

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title, excerpt, category, tags')
      .order('publishedAt', { ascending: false })
      .limit(500); // Seguridad: no cargar más de 500 filas de golpe

    let fixed = 0;
    const corrections = [];

    for (const art of articles || []) {
      const detected = detectBestCategory(art);
      if (detected && detected !== art.category) {
        const { error } = await supabase
          .from('articles')
          .update({ category: detected, updated_at: new Date().toISOString() })
          .eq('id', art.id);

        if (!error) {
          fixed++;
          corrections.push({ from: art.category, to: detected, title: art.title.slice(0, 50) });
        }
      }
    }

    return NextResponse.json({
      success: true,
      total_reviewed: articles?.length || 0,
      fixed,
      corrections: corrections.slice(0, 20),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
