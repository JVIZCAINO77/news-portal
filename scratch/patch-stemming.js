/**
 * patch-stemming.js
 * Añade stemming básico en español al extractKeywords() de producción.
 * Esto hace que "petroleros", "petrolera", "petróleo" → "petrole"
 * y se detecten como el mismo tema aunque usen formas distintas.
 */
const fs = require('fs');
const path = require('path');

// Stemming básico: recortar sufijos comunes del español
const STEMMING_FN = `
/**
 * Stemming básico en español: recorta sufijos comunes para agrupar
 * palabras de la misma raíz (ej: petroleros/petrolera/petróleo → petrole).
 */
function stemWord(word) {
  if (word.length <= 5) return word;
  // Sufijos de mayor a menor (orden importa)
  const suffixes = [
    'aciones','ización','amiento','imientos','amiento',
    'adores','adora','adores','antes','antes',
    'iendo','ando','ación','arios','arias',
    'mente','istas','ista','osos','osas',
    'eros','eras','eros','ismo','ista',
    'ado','ada','ados','adas','ido','ida','idos','idas',
    'ando','iendo','aron','aron',
    'era','ero','ura','ura',
    'es','os','as',
  ];
  for (const s of suffixes) {
    if (word.endsWith(s) && word.length - s.length >= 4) {
      return word.slice(0, word.length - s.length);
    }
  }
  return word;
}
`;

const files = [
  path.join(__dirname, '..', 'scripts', 'publish-now.js'),
  path.join(__dirname, '..', 'app', 'api', 'cron', 'bot', 'route.js'),
];

for (const filePath of files) {
  let src = fs.readFileSync(filePath, 'utf8');
  const name = path.basename(filePath);

  // 1. Añadir función stemWord antes de extractKeywords
  if (!src.includes('function stemWord(')) {
    src = src.replace('function extractKeywords(title)', STEMMING_FN + '\nfunction extractKeywords(title)');
    console.log(`✅ ${name}: stemWord() añadido`);
  } else {
    console.log(`⚠️  ${name}: stemWord() ya existe`);
  }

  // 2. Actualizar extractKeywords para aplicar stemming
  // Antes: return new Set(n.split(/\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)));
  // Después: aplica stemWord a cada token
  src = src.replace(
    "return new Set(\n    normalized.split(/\\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w))\n  );",
    "return new Set(\n    normalized.split(/\\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)).map(stemWord)\n  );"
  );
  // Variantes de formato
  src = src.replace(
    "return new Set(normalized.split(/\\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)));",
    "return new Set(normalized.split(/\\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)).map(stemWord));"
  );
  src = src.replace(
    "return new Set(\n    normalized.split(/\\s+/).filter(w =\\u003e w.length \\u003e 3 \\u0026\\u0026 !STOP_WORDS.has(w))\n  );",
    "return new Set(\n    normalized.split(/\\s+/).filter(w => w.length > 3 && !STOP_WORDS.has(w)).map(stemWord)\n  );"
  );

  if (src.includes('.map(stemWord)')) {
    console.log(`✅ ${name}: extractKeywords usa stemming`);
  } else {
    console.log(`⚠️  ${name}: no se pudo aplicar stemming — revisar manualmente`);
  }

  fs.writeFileSync(filePath, src, 'utf8');
}

console.log('\nPatch aplicado.');
