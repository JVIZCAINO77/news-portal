// scratch/fix_admin_encoding.js — Arregla encoding corrupto en archivos admin
const fs = require('fs');

const files = [
  'app/admin/articulos/page.js',
  'app/admin/perfil/page.js',
  'app/admin/usuarios/page.js'
];

const FORCE_DYNAMIC = "export const dynamic = 'force-dynamic';\n\n";

files.forEach(f => {
  const buf = fs.readFileSync(f);
  let text;
  if (buf[0] === 0xFF && buf[1] === 0xFE) {
    text = buf.toString('utf16le').replace(/\uFEFF/g, '');
  } else {
    text = buf.toString('utf8');
  }

  const lines = text.split('\n');
  // Skip the corrupted first lines (the bad comment + export the PowerShell added)
  let startIdx = 0;
  for (let i = 0; i < Math.min(6, lines.length); i++) {
    const l = lines[i].trim();
    if (l.startsWith('export const dynamic')) {
      startIdx = i + 1; // skip past the export line too
      while (startIdx < lines.length && lines[startIdx].trim() === '') startIdx++;
      break;
    }
    if (l.includes('force-dynamic') && !l.startsWith('export') && !l.startsWith('//')) {
      startIdx = i + 1;
      break;
    }
  }

  const cleanContent = lines.slice(startIdx).join('\n');
  const finalContent = FORCE_DYNAMIC + cleanContent;
  fs.writeFileSync(f, finalContent, { encoding: 'utf8', flag: 'w' });
  console.log('Fixed:', f, '(started at line', startIdx, ')');
});
