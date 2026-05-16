/**
 * patch-threshold-15.js
 * Baja el SEMANTIC_THRESHOLD de 25% a 15% en publish-now.js
 * y reduce entidades compartidas requeridas de 2 a 1 para la Capa 4.
 * Esto captura los pares: Guyana×2, Cuba×2, Kiev×2.
 */
const fs = require('fs');
const path = require('path');

const files = [
  { file: path.join(__dirname, '..', 'scripts', 'publish-now.js'), th: '0.25', ent: '>= 2' },
  { file: path.join(__dirname, '..', 'app', 'api', 'cron', 'bot', 'route.js'), th: '0.25', ent: '>= 2' },
];

for (const { file, th, ent } of files) {
  let src = fs.readFileSync(file, 'utf8');
  const name = path.basename(file);

  // Bajar threshold de 25% a 15%
  const before = src;
  src = src.replace('const SEMANTIC_THRESHOLD = 0.25;', 'const SEMANTIC_THRESHOLD = 0.15;');
  if (src !== before) console.log(`✅ ${name}: threshold 0.25 → 0.15`);
  else console.log(`⚠️  ${name}: threshold no cambiado (ya es 0.15 o no encontrado)`);

  // Cambiar entidades requeridas de >= 2 a >= 1
  src = src.replace(
    'return [...entA].filter(e => entB.has(e)).length >= 2;',
    'return [...entA].filter(e => entB.has(e)).length >= 1;'
  );
  if (!src.includes('.length >= 2')) console.log(`✅ ${name}: entidades requeridas 2 → 1`);

  fs.writeFileSync(file, src, 'utf8');
}
