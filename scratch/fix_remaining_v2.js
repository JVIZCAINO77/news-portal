/**
 * fix_remaining_v2.js — Targeted fix for articles identified in the manual audit.
 */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SECTION_AUTHORS = {
  noticias:       'Redacción Central',
  politica:       'Mesa Política',
  economia:       'Redacción Económica',
  internacional:  'Redacción Internacional',
  deportes:       'Mesa Deportiva',
  sucesos:        'Redacción de Sucesos',
  salud:          'Sección de Salud y Bienestar',
  entretenimiento:'Sección Espectáculos',
  cultura:        'Sección Cultural',
  tecnologia:     'Redacción Tecnológica',
  tendencias:     'Mesa de Tendencias',
  opinion:        'Dirección Editorial',
};

const FIX_LIST = [
  { match: 'Explotados, unirse y ganar', category: 'opinion' },
  { match: 'Presidente Trump evacuado tras disparos', category: 'internacional' },
  { match: 'Patxi López asegura que el conflicto', category: 'politica' },
  { match: 'avioneta se estrella en Dajabón', category: 'sucesos' },
  { match: 'Joven de Santo Domingo solicita ayuda', category: 'salud' },
  { match: 'Metro de Santo Domingo: la crisis silenciosa', category: 'noticias' },
  { match: 'ataque israelí al sur del Líbano', category: 'internacional' },
  { match: 'Wolmer Murillo logra la gloria', category: 'deportes' },
  { match: 'Parlamento británico bloquea investigación', category: 'politica' },
  { match: 'Los Praditos se transforma', category: 'noticias' },
  { match: 'Muerte a tiros en Mirador Sur', category: 'sucesos' },
  { match: '400 líderes religiosos se reúnen en Malasia', category: 'internacional' },
  { match: '¿Crecen las tradwives?', category: 'tendencias' },
  { match: 'Gold Quest revela planes de minería', category: 'economia' },
  { match: 'Renuncias en Agricultura amenazan', category: 'economia' },
  { match: 'Plan de atentado contra Taylor Swift', category: 'sucesos' },
  { match: 'Trump denuncia ‘colapso’ en Irán', category: 'internacional' },
  { match: 'Randy Nota Loca y Dei V', category: 'entretenimiento' },
  { match: 'Donald Trump gana en Florida y Ohio', category: 'politica' },
  { match: 'El hombre con ensalada que se volvió viral', category: 'tendencias' },
  { match: 'Cámara de Cuentas manda 50 expedientes', category: 'politica' },
  { match: 'Ganadores del balonmano caribeño', category: 'deportes' },
  { match: 'muerte de Licairis Yalibes', category: 'sucesos' },
  { match: '¡Trapecio petrolero!', category: 'economia' },
];

async function runFixes() {
  console.log("🚀 Starting manual article correction...");
  
  for (const item of FIX_LIST) {
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, category')
      .ilike('title', `%${item.match}%`);

    if (fetchError) {
      console.error(`Error fetching "${item.match}":`, fetchError);
      continue;
    }

    if (!articles || articles.length === 0) {
      console.log(`⚠️  No article found matching: "${item.match}"`);
      continue;
    }

    for (const article of articles) {
      if (article.category === item.category) {
        console.log(`✅ Already correct: "${article.title}" is in ${item.category}`);
        continue;
      }

      console.log(`🔧 Moving: "${article.title}"`);
      console.log(`   FROM: ${article.category}  ->  TO: ${item.category}`);
      
      const { error: updateError } = await supabase
        .from('articles')
        .update({ 
          category: item.category,
          author: SECTION_AUTHORS[item.category]
        })
        .eq('id', article.id);

      if (updateError) {
        console.error(`❌ Error updating "${article.title}":`, updateError);
      } else {
        console.log(`✅ Success!`);
      }
    }
  }
  
  console.log("\n🏁 Done.");
}

runFixes();
