import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DIRS_TO_SCAN = ['app', 'components', 'lib'];

let totalFiles = 0;
let errorsFound = [];

// Patrones a buscar
const PATTERNS = {
  emptyLinks: /href=(['"])(?:#|)\1/g,
  loremIpsum: /lorem ipsum/i,
  todoComments: /\/\/\s*TODO/i,
  missingAlt: /<img[^>]*((?!alt=)[^>])*>/g, // Básico, Next/Image requiere alt
};

// Rutas estáticas conocidas
const validRoutes = ['/', '/nosotros', '/contacto', '/privacidad', '/terminos', '/aviso-legal', '/buscar'];
// Categorías activas
const validCategories = ['politica', 'economia', 'internacional', 'deportes', 'sucesos', 'salud', 'entretenimiento', 'cultura', 'tecnologia'];

function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (/\.(js|jsx)$/.test(file)) {
      totalFiles++;
      scanFile(fullPath);
    }
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(ROOT_DIR, filePath);

  // 1. Buscar enlaces vacíos (href="#" o href="")
  let match;
  while ((match = PATTERNS.emptyLinks.exec(content)) !== null) {
    errorsFound.push(`[Enlace Vacío] ${relativePath} - Posible botón o link no funcional.`);
  }

  // 2. Buscar texto de relleno (Lorem Ipsum)
  if (PATTERNS.loremIpsum.test(content)) {
    errorsFound.push(`[Texto Falso] ${relativePath} - Contiene 'Lorem Ipsum'.`);
  }

  // 3. Buscar enlaces estáticos a categorías eliminadas
  const oldCats = ['noticias', 'tendencias', 'opinion'];
  for (const cat of oldCats) {
    if (content.includes(`/categoria/${cat}`)) {
      errorsFound.push(`[Categoría Obsoleta] ${relativePath} - Contiene enlace a la categoría eliminada '${cat}'.`);
    }
  }

  // 4. Buscar `<Image>` sin `alt`
  // En Next.js <Image> es estricto, pero <img /> nativo podría colarse
  const imgTags = content.match(/<img[^>]*>/g) || [];
  for (const img of imgTags) {
    if (!img.includes('alt=')) {
      errorsFound.push(`[Falta Alt en Imagen] ${relativePath} - Elemento <img> sin atributo 'alt'.`);
    }
  }
}

console.log('🔍 Iniciando Auditoría Profunda del Código...');

DIRS_TO_SCAN.forEach(dir => {
  const fullDir = path.join(ROOT_DIR, dir);
  if (fs.existsSync(fullDir)) {
    scanDirectory(fullDir);
  }
});

console.log(`\nArchivos analizados: ${totalFiles}`);
console.log('─'.repeat(50));

if (errorsFound.length === 0) {
  console.log('✅ ¡Excelente! No se detectaron enlaces rotos, textos falsos ni errores básicos en el código.');
} else {
  console.log(`⚠️ Se encontraron ${errorsFound.length} advertencias:\n`);
  errorsFound.forEach(err => console.log(`- ${err}`));
}
