/**
 * patch-generic-entities.js
 * Actualiza extractEntities() en publish-now.js y cron/bot/route.js
 * para excluir entidades genéricas (RD, EEUU, etc.) que causan falsos positivos.
 */
const fs = require('fs');
const path = require('path');

const GENERIC_BLOCK = `
// Entidades demasiado genéricas para discriminar eventos (excluidas de la Capa 4)
const GENERIC_ENTITIES = new Set([
  'republica','dominicana','dominicano','dominicanos','dominicanas',
  'estados','unidos','eeuu','america','americana','americana',
  'mundo','pais','paises','gobierno','presidente','nacional',
  'nueva','nuevo','gran','grandes','primer','primera',
  'santo','domingo','santiago','haiti','haitiano',
]);
`;

const OLD_EXTRACT_ENTITIES = `function extractEntities(title) {
  if (!title) return new Set();
  const entities = new Set();
  for (const w of title.split(/\\s+/)) {
    const clean = w.replace(/[^a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1]/g, '');
    if (clean.length >= 4 && /^[A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]/.test(clean)) {
      entities.add(clean.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''));
    }
  }
  return entities;
}`;

const NEW_EXTRACT_ENTITIES = `function extractEntities(title) {
  if (!title) return new Set();
  const entities = new Set();
  for (const w of title.split(/\\s+/)) {
    const clean = w.replace(/[^a-zA-Z\u00e1\u00e9\u00ed\u00f3\u00fa\u00c1\u00c9\u00cd\u00d3\u00da\u00f1\u00d1]/g, '');
    if (clean.length >= 4 && /^[A-Z\u00c1\u00c9\u00cd\u00d3\u00da\u00d1]/.test(clean)) {
      const norm = clean.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
      if (!GENERIC_ENTITIES.has(norm)) entities.add(norm);
    }
  }
  return entities;
}`;

const files = [
  path.join(__dirname, '..', 'scripts', 'publish-now.js'),
  path.join(__dirname, '..', 'app', 'api', 'cron', 'bot', 'route.js'),
];

for (const filePath of files) {
  let src = fs.readFileSync(filePath, 'utf8');
  const name = path.basename(filePath);

  // Insertar GENERIC_ENTITIES justo antes de extractEntities
  if (!src.includes('GENERIC_ENTITIES')) {
    src = src.replace('function extractEntities(title)', GENERIC_BLOCK + '\nfunction extractEntities(title)');
    console.log(`✅ ${name}: GENERIC_ENTITIES añadido`);
  } else {
    console.log(`⚠️  ${name}: GENERIC_ENTITIES ya existe`);
  }

  // Actualizar extractEntities para usar la lista
  if (src.includes(OLD_EXTRACT_ENTITIES)) {
    src = src.replace(OLD_EXTRACT_ENTITIES, NEW_EXTRACT_ENTITIES);
    console.log(`✅ ${name}: extractEntities() actualizado`);
  } else {
    // Intentar con el patrón del archivo (CRLF vs LF)
    console.log(`⚠️  ${name}: extractEntities() no coincide exactamente — revisando...`);
    // Patch manual: encontrar la linea con entities.add y añadir el filtro
    if (src.includes('if (!GENERIC_ENTITIES.has(norm)) entities.add(norm)')) {
      console.log(`   → Ya tiene el filtro`);
    } else if (src.includes("entities.add(clean.toLowerCase().normalize('NFD').replace")) {
      src = src.replace(
        "entities.add(clean.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, ''));",
        "const norm = clean.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');\n      if (!GENERIC_ENTITIES.has(norm)) entities.add(norm);"
      );
      console.log(`✅ ${name}: filtro de entidades genéricas insertado`);
    }
  }

  fs.writeFileSync(filePath, src, 'utf8');
}

console.log('\nVerificando sintaxis...');
