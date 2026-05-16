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
const CATEGORY_KEYWORDS = {
  // ── Categorías de barra principal ──────────────────────────────────────────
  deportes: ['deporte','béisbol','beisbol','fútbol','futbol','baloncesto','nba','mlb',
              'pelotero','atleta','jugador','equipo','partido','torneo','campeonato',
              'liga','gol','jonrón','jonron','pitcher','cancha','estadio','boxeo',
              'tenis','ciclismo','medalla','clasificatoria','olímpico','béisbol dominicano'],
  economia: ['economía','economia','económico','financiero','pib','inflación','inflacion',
             'banco central','banco','dólar','dolar','mercado','inversión','empresa',
             'comercio','impuesto','presupuesto','exportación','exportacion',
             'precio','deficit','reservas','bolsa','deuda','aranceles','empleo',
             'desempleo','crecimiento','remesas','hacienda','finanzas'],
  politica: ['política','politica','político','presidente','ministro',
             'diputado','senador','partido','elecciones','congreso','legislación',
             'decreto','reforma','municipio','alcalde','gabinete','ejecutivo',
             'legislativo','campaña','voto','candidato','abinader','danilo','leonel'],
  salud: ['salud','médico','medico','hospital','enfermedad','vacuna','tratamiento',
          'paciente','clínica','clinica','medicina','virus','pandemia','cáncer',
          'cancer','diabetes','bienestar','prevención','nutrición','epidemia',
          'sanitario','cirugía','cirugia','farmacia','oms'],
  entretenimiento: ['espectáculo','espectaculo','farandula','actor','actriz','cantante',
                    'película','pelicula','serie','concierto','artista','música','musica',
                    'teatro','show','celebridad','estreno','nominación','premio',
                    'reggaeton','bachata','merengue','influencer'],
  cultura: ['cultura','arte','museo','exposición','exposicion','patrimonio','literatura',
            'libro','autor','escritor','festival','danza','folclore','tradición',
            'gastronomía','gastronomia','arquitectura','artesanía','artesania',
            'identidad cultural','carnaval','semana santa'],
  tecnologia: ['tecnología','tecnologia','inteligencia artificial','ia','robot','app',
               'software','hardware','digital','internet','ciberseguridad','startup',
               'innovación','samsung','apple','google','meta','openai',
               'computadora','smartphone','chatgpt','drone','bitcoin','crypto'],
  sucesos: ['detenido','arrestado','capturado','homicidio','asesinado','robo',
            'accidente','incendio','crimen','herido','muerto','matan','secuestro',
            'víctima','sospechoso','fugitivo','delito','colisión','choque','fallece'],
  entretenimiento: ['espectáculo','espectaculo','farandula','actor','actriz','cantante',
                    'película','pelicula','serie','concierto','artista','música','musica',
                    'teatro','show','celebridad','estreno','nominación','premio',
                    'reggaeton','bachata','merengue','influencer'],
  internacional: ['internacional','mundial','eeuu','estados unidos','europa','china',
                  'rusia','latinoamérica','latinoamerica','onu','biden','trump',
                  'guerra','conflicto','diplomacia','cumbre','tratado','global',
                  'extranjero','migrantes','migracion','israel','ucrania','haití haiti'],
  policia: ['policía nacional','pn','dncd','dicrim','fiscalía','fiscalia','tribunal',
            'juez','fiscal','cárcel','carcel','preso','condena','arresto',
            'operativo','banda','narco','crimen organizado','denuncia','abogado',
            'fiscalía','ministerio público','juicio'],
  // ── Nuevas categorías ────────────────────────────────────────────────────
  nacional: ['república dominicana','dominicano','dominicana','santo domingo',
             'santiago','san pedro','la romana','barahona','san cristóbal',
             'región','provincia','municipio','ayuntamiento','intrant',
             'mesc','mopc','adie','caasd','edenorte','edesur','inapa',
             'indotel','digesett','senasa','salud pública dominicana'],
  'medio-ambiente': ['medio ambiente','medioambiente','cambio climático','cambio climatico',
                     'calentamiento','deforestación','deforestacion','reforestación',
                     'contaminación','contaminacion','reciclaje','sostenible',
                     'biodiversidad','parque nacional','cuenca','sequía','sequia',
                     'huracán','huracan','tormenta tropical','inundación','inundacion',
                     'ecosistema','flora','fauna','residuos sólidos'],
};

const CATEGORY_BLOCKLIST = {
  deportes:        ['homicidio','asesinado','inflacion','pib','ministro de gobierno'],
  economia:        ['beisbol','jonron','mlb','nba','actor','actriz','cantante','homicidio'],
  politica:        ['beisbol','jonron','mlb','nba','actor','actriz','cantante','homicidio'],
  salud:           ['beisbol','jonron','mlb','presidente abinader','partido politico'],
  entretenimiento: ['presidente abinader','ministro de','pib','inflacion','banco central','homicidio'],
  cultura:         ['beisbol','jonron','mlb','nba','pib','inflacion','banco central'],
  tecnologia:      ['homicidio','asesinado','presidente abinader','beisbol'],
  sucesos:         ['actor','actriz','cantante','concierto','beisbol','jonron','mlb','nba','pib'],
  tendencias:      ['pib','inflacion','banco central','reforma constitucional','homicidio'],
  internacional:   ['presidente abinader','senado dominicano','camara de diputados','ayuntamiento de'],
  policia:         ['actor','actriz','cantante','concierto','beisbol','jonron','mlb','nba','pib'],
  nacional:        [
    // Geopolítica / internacional
    'trump','putin','zelensky','rusia','ucrania','china','iran','israel',
    'palestina','corea del norte','guerra','ataque militar','bombardeo',
    'eeuu','estados unidos','europa','onu','otan',
    // Política formal
    'presidente abinader','ministro de','senado dominicano','camara de diputados',
    'partido politico','proyecto de ley','decreto presidencial','legislacion',
    'pld','prm','fuerza del pueblo','reforma constitucional','jce','elecciones',
    // Economía técnica
    'pib','inflacion','banco central','exportacion','importacion',
    'deficit','reservas internacionales','bolsa de valores',
    // Deportes
    'beisbol','jonron','mlb','nba','gol','futbol','baloncesto','pelotero',
    'campeonato','torneo','liga','atleta','estadio','pitcher',
    // Entretenimiento
    'actor','actriz','cantante','concierto','farandula','espectaculo',
    'pelicula','serie','netflix','reggaeton','bachata','merengue','influencer',
    // Crimen grave
    'homicidio','asesinado','asesinato','feminicidio','matan',
    'tiroteo','secuestro','narco','banda criminal','operativo policial',
    // Salud técnica
    'vacuna','pandemia','virus','epidemia','cancer','diabetes',
    // Tecnología
    'inteligencia artificial','chatgpt','openai','samsung','apple',
    'ciberseguridad','bitcoin','crypto','drone','robot',
  ],
  'medio-ambiente':['beisbol','jonron','mlb','nba','actor','actriz','cantante'],
};

const VALID_CATEGORIES = Object.keys(CATEGORY_KEYWORDS);
const FALLBACK_CATEGORY = 'nacional'; // Reemplaza 'noticias' como categoría por defecto


function normalize(str) {
  return (str || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectBestCategory(article) {
  const text = normalize(`${article.title} ${article.excerpt || ''} ${(article.tags || []).join(' ')}`);

  // Si ya está en una sección comodín válida, NO intentar reclasificar
  // Nacional y medio-ambiente son sumideros intencionales — no los movemos
  if (article.category === 'nacional' || article.category === 'medio-ambiente' || article.category === 'noticias') {
    return article.category;
  }
  
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
  return FALLBACK_CATEGORY;
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
