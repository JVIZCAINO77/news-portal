/**
 * audit_and_fix_categories.js
 * Audita todos los artículos y reclasifica los que están en la sección incorrecta.
 * Uso: node scratch/audit_and_fix_categories.js
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── REGLAS DE CLASIFICACIÓN ─────────────────────────────────────────────────
// Para cada categoría: palabras que DEBEN estar presentes en el título/excerpt
const CATEGORY_KEYWORDS = {
  deportes: ['deporte','béisbol','beisbol','fútbol','futbol','baloncesto','nba','mlb',
              'pelotero','atleta','jugador','equipo','partido','torneo','campeonato',
              'liga','gol','jonrón','jonron','pitcher','cancha','estadio','boxeo',
              'tenis','ciclismo','medalla','clasificatoria','mundial','olímpico'],
  economia: ['economía','economia','económico','financiero','pib','inflación','inflacion',
             'banco','dólar','dolar','mercado','inversión','inversion','empresa',
             'comercio','impuesto','presupuesto','exportación','exportacion',
             'importación','importacion','precio','deficit','reservas','bolsa',
             'deuda','aranceles','crecimiento económico','desempleo','empleo'],
  politica: ['política','politica','político','gobierno','presidente','ministro',
             'diputado','senador','partido','elecciones','congreso','legislación',
             'decreto','reforma','municipio','alcalde','gabinete','ejecutivo',
             'legislativo','campaña','voto','candidato'],
  salud: ['salud','médico','medico','hospital','enfermedad','vacuna','tratamiento',
          'paciente','clínica','clinica','medicina','virus','pandemia','cáncer',
          'cancer','diabetes','bienestar','prevención','prevencion','nutrición',
          'farmaco','epidemia','sanitario','cirugía','cirugia'],
  entretenimiento: ['espectáculo','espectaculo','farandula','actor','actriz','cantante',
                    'pelicula','película','serie','concierto','artista','música','musica',
                    'teatro','show','celebridad','estreno','nominación','premio',
                    'reggaeton','bachata','merengue','influencer','instagram'],
  cultura: ['cultura','arte','museo','exposición','exposicion','patrimonio','literatura',
            'libro','autor','escritor','festival','danza','folclore','tradición',
            'tradicion','gastronomía','gastronomia','arquitectura','identidad',
            'artesanía','artesania'],
  tecnologia: ['tecnología','tecnologia','inteligencia artificial','ia','robot','app',
               'software','hardware','digital','internet','ciberseguridad','startup',
               'innovación','innovacion','samsung','apple','google','meta','openai',
               'computadora','smartphone','chatgpt','drone'],
  sucesos: ['detenido','arrestado','capturado','homicidio','asesinado','robo',
            'accidente','incendio','crimen','policía','policia','autoridades',
            'investigación','investigacion','víctima','victima','sospechoso',
            'fugitivo','delito','herido','muerto','matan','secuestro'],
  tendencias: ['viral','tendencia','redes sociales','tiktok','instagram','twitter',
               'youtube','influencer','meme','trending','popular','hashtag'],
  internacional: ['internacional','mundial','eeuu','estados unidos','europa','china',
                  'rusia','latinoamérica','latinoamerica','onu','biden','trump',
                  'guerra','conflicto','diplomacia','cumbre','tratado','global',
                  'extranjero','migracion','migrantes'],
  policia: ['policía nacional','pn','dncd','dicrim','fiscalía','fiscalia','tribunal',
            'juez','fiscal','justicia','cárcel','carcel','preso','condena','arresto',
            'operativo','banda','narco','crimen organizado','denuncia','abogado'],
  noticias: [], // Noticias es la categoría comodín — acepta todo lo nacional
};

// Palabras que EXCLUYEN una categoría
const CATEGORY_BLOCKLIST = {
  deportes:        ['homicidio','asesinado','asesinato','inflacion','pib','ministro de'],
  economia:        ['beisbol','jonron','mlb','nba','actor','actriz','cantante','farandula','gol'],
  politica:        ['beisbol','jonron','mlb','nba','actor','actriz','cantante','farandula','homicidio'],
  salud:           ['beisbol','jonron','mlb','presidente abinader','partido politico'],
  entretenimiento: ['presidente abinader','ministro de','pib','inflacion','banco central','homicidio'],
  cultura:         ['beisbol','jonron','mlb','nba','pib','inflacion','banco central','homicidio'],
  tecnologia:      ['homicidio','asesinado','presidente abinader','senado dominicano','beisbol'],
  sucesos:         ['actor','actriz','cantante','concierto','beisbol','jonron','mlb','nba','pib','inflacion'],
  tendencias:      ['pib','inflacion','banco central','reforma constitucional','homicidio','beisbol'],
  internacional:   ['presidente abinader','senado dominicano','camara de diputados','ayuntamiento de'],
  policia:         ['actor','actriz','cantante','concierto','beisbol','jonron','mlb','nba','pib'],
  noticias:        [],
};

const VALID_CATEGORIES = Object.keys(CATEGORY_KEYWORDS);

function normalize(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectBestCategory(article) {
  const text = normalize(`${article.title} ${article.excerpt || ''} ${(article.tags || []).join(' ')}`);
  
  const scores = {};
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (cat === 'noticias') continue; // noticias es último recurso
    
    // Verificar blocklist primero
    const blocked = (CATEGORY_BLOCKLIST[cat] || []).some(w => text.includes(normalize(w)));
    if (blocked) { scores[cat] = -1; continue; }
    
    // Contar hits de keywords
    const hits = keywords.filter(kw => text.includes(normalize(kw))).length;
    scores[cat] = hits;
  }
  
  // Ordenar por score
  const ranked = Object.entries(scores)
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a);
  
  if (ranked.length > 0) return ranked[0][0];
  return 'noticias'; // fallback
}

async function main() {
  console.log('🔍 Auditando artículos...\n');

  // Cargar todos los artículos
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, excerpt, category, tags')
    .order('publishedAt', { ascending: false });

  if (error) { console.error('Error BD:', error.message); return; }

  console.log(`📊 Total artículos: ${articles.length}\n`);

  const toFix = [];
  const categoryStats = {};

  for (const art of articles) {
    const currentCat = art.category;
    const detectedCat = detectBestCategory(art);

    // Contar por categoría actual
    categoryStats[currentCat] = (categoryStats[currentCat] || 0) + 1;

    // Si la categoría detectada es diferente Y tiene confianza alta
    if (detectedCat !== currentCat && detectedCat !== 'noticias') {
      toFix.push({
        id: art.id,
        title: art.title.slice(0, 70),
        from: currentCat,
        to: detectedCat,
      });
    }
  }

  // Mostrar estadísticas
  console.log('📂 ARTÍCULOS POR SECCIÓN:');
  for (const [cat, count] of Object.entries(categoryStats).sort(([, a], [, b]) => b - a)) {
    console.log(`   ${cat.padEnd(20)} → ${count} artículos`);
  }

  console.log(`\n⚠️  ARTÍCULOS MAL CLASIFICADOS: ${toFix.length}`);
  
  if (toFix.length === 0) {
    console.log('✅ Todos los artículos están en la sección correcta.');
    return;
  }

  // Mostrar los primeros 20
  for (const fix of toFix.slice(0, 20)) {
    console.log(`  [${fix.from} → ${fix.to}] "${fix.title}"`);
  }
  if (toFix.length > 20) console.log(`  ... y ${toFix.length - 20} más`);

  // Aplicar correcciones
  console.log('\n🔧 Aplicando correcciones...');
  let fixed = 0;
  for (const fix of toFix) {
    const { error: updateError } = await supabase
      .from('articles')
      .update({ category: fix.to, updated_at: new Date().toISOString() })
      .eq('id', fix.id);
    
    if (!updateError) {
      fixed++;
    } else {
      console.error(`  ❌ Error corrigiendo ${fix.id}: ${updateError.message}`);
    }
  }

  console.log(`\n✅ ${fixed} artículos reclasificados correctamente.`);
}

main().catch(console.error);
