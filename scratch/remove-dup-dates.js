/**
 * remove-dup-dates.js
 * Elimina la redeclaracion de todayDR/startOfToday/endOfToday
 * que quedo dentro de processCategory en publish-now.js
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'scripts', 'publish-now.js');
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

let inProcessCat = false;
let removedStart = -1;
let removedEnd = -1;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Detectar cuando entramos a processCategory con los nuevos parametros
  if (line.includes('async function processCategory(catKey, todayDR')) {
    inProcessCat = true;
  }
  
  // Dentro de processCategory, buscar la redeclaracion de todayDR
  if (inProcessCat && removedStart === -1 && line.includes("const todayDR = new Intl.DateTimeFormat")) {
    removedStart = i;
    console.log('Encontrado inicio en linea', i+1, ':', line.trim());
  }
  
  // Buscar el fin del bloque (la segunda .toISOString() - la de endOfToday)
  if (inProcessCat && removedStart >= 0 && removedEnd === -1 && i > removedStart) {
    if (line.includes('.toISOString();') && i >= removedStart + 2) {
      removedEnd = i;
      console.log('Encontrado fin en linea', i+1, ':', line.trim());
      break;
    }
  }
}

if (removedStart >= 0 && removedEnd >= 0) {
  console.log('\nEliminando lineas ' + (removedStart+1) + ' a ' + (removedEnd+1) + ':');
  for (let i = removedStart; i <= removedEnd; i++) {
    console.log('  [' + (i+1) + '] ' + lines[i].trim());
  }
  
  // Eliminar el bloque (incluyendo la linea en blanco antes si existe)
  const toDelete = removedEnd - removedStart + 1;
  lines.splice(removedStart, toDelete);
  
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('\n✅ Bloque eliminado. Archivo guardado.');
} else {
  console.log('❌ No se encontro el bloque duplicado.');
  console.log('removedStart:', removedStart, 'removedEnd:', removedEnd);
}
