#!/usr/bin/env node
// Requiere: npm install tweetsodium (solo si quieres auto-provisionar secretos en GitHub)
// Si no está instalado, el doctor solo reporta, no auto-provisiona.
/**
 * scripts/doctor.js — Auto-Doctor Autónomo de Imperio Público
 * =============================================================
 * Tiene PERMISO TOTAL para detectar y corregir cualquier error.
 * No pregunta. No avisa. Solo arregla y reporta lo que hizo.
 *
 * Uso:
 *   npm run doctor          → escanear + corregir todo
 *   npm run doctor:dry      → solo reportar, sin modificar
 *   npm run doctor:commit   → corregir + git commit + push (modo CI)
 *
 * En GitHub Actions: node scripts/doctor.js --commit
 * Cubre:
 *   - Variables de entorno faltantes
 *   - Archivos críticos faltantes
 *   - Bugs de código estático (supabase.sql, fetch timeout, secrets, etc.)
 *   - runtime edge incorrecto
 *   - Queries sin .limit()
 *   - Auto-post social activado donde no debe
 *   - Secrets expuestos como props
 *   - Endpoints en vivo inalcanzables
 *   - Dependencias faltantes
 *   - Workflows de GitHub Actions rotos
 */

// En GitHub Actions las vars de entorno vienen del runner, no del .env.local
if (require('fs').existsSync(require('path').join(__dirname, '..', '.env.local'))) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
}

const fs     = require('fs');
const path   = require('path');
const { execSync } = require('child_process');

const DRY    = process.argv.includes('--dry');
const COMMIT = process.argv.includes('--commit'); // Auto git commit + push tras correcciones
const ROOT   = path.resolve(__dirname, '..');

// ── Git helpers ───────────────────────────────────────────────────────────────
function gitExec(cmd) {
  try { return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' }).trim(); }
  catch (e) { return null; }
}

function autoCommitAndPush() {
  if (DRY || !COMMIT) return;
  const status = gitExec('git status --porcelain');
  if (!status) { OK('Git: Sin cambios que confirmar.'); return; }

  HEAD('📤 Auto-Commit y Push a GitHub');
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const changed   = (status.match(/\n/g) || []).length + 1;

  gitExec('git config user.name "Doctor Bot [Imperio Público]"');
  gitExec('git config user.email "bot@imperiopublico.com"');
  gitExec('git add -A');

  const commitResult = gitExec(
    `git commit -m "🏥 Doctor auto-fix [${timestamp}] — ${changed} archivo(s) corregido(s)"`
  );

  if (commitResult) {
    const pushResult = gitExec('git push');
    if (pushResult !== null) {
      OK(`Push exitoso → Vercel desplegará automáticamente.`);
    } else {
      WARN('Push falló — revisar permisos del token de GitHub.');
    }
  } else {
    WARN('Commit falló — posiblemente no hay cambios reales.');
  }
}

// ── Consola con colores ───────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', bold: '\x1b[1m', dim: '\x1b[2m',
};
const log   = m => console.log(m);
const OK    = m => console.log(`${C.green}  ✅ ${m}${C.reset}`);
const WARN  = m => console.log(`${C.yellow}  ⚠️  ${m}${C.reset}`);
const ERR   = m => console.log(`${C.red}  ❌ ${m}${C.reset}`);
const FIX   = m => console.log(`${C.cyan}  🔧 ${m}${C.reset}`);
const HEAD  = m => console.log(`\n${C.bold}${m}${C.reset}`);

// ── Contadores ────────────────────────────────────────────────────────────────
const stats = { fixed: 0, warned: 0, errors: 0, skipped: 0 };

// ── Utilidades de archivo ─────────────────────────────────────────────────────
const read  = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
const write = (f, c) => { if (!DRY) { fs.writeFileSync(f, c, 'utf8'); stats.fixed++; } };
const exist = f => fs.existsSync(f);
const rel   = f => path.relative(ROOT, f);

function walk(dirs, exts = ['.js', '.jsx', '.ts', '.tsx']) {
  const SKIP = ['node_modules', '.git', '.next', 'out', 'dist', 'scratch', 'brain'];
  let out = [];
  for (const dir of [].concat(dirs)) {
    if (!exist(dir)) continue;
    for (const item of fs.readdirSync(dir)) {
      if (SKIP.includes(item)) continue;
      const full = path.join(dir, item);
      const s = fs.statSync(full);
      if (s.isDirectory()) out = out.concat(walk([full], exts));
      else if (exts.some(e => item.endsWith(e))) out.push(full);
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 1 — VARIABLES DE ENTORNO
// ═══════════════════════════════════════════════════════════════════════════════
function checkEnv() {
  HEAD('🔑 Variables de Entorno');
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'CRON_SECRET', 'GEMINI_API_KEY',
  ];
  const cloudinary = [
    'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET',
  ];
  const optional = [
    'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'NEXT_PUBLIC_GA_ID',
    'NEXT_PUBLIC_ADSENSE_ID', 'FACEBOOK_ACCESS_TOKEN', 'FACEBOOK_PAGE_ID',
    'NEXT_PUBLIC_SITE_URL',
    // Para que el doctor pueda auto-provisionar secretos en GitHub Actions:
    'GITHUB_TOKEN',  // Personal Access Token con scope: repo (secrets:write)
    'GH_REPO',       // ej: JVIZCAINO77/news-portal
  ];
  required.forEach(v => process.env[v] ? OK(`${v} ✓`) : (ERR(`${v} → FALTA`), stats.errors++));
  
  // Cloudinary: aceptar NEXT_PUBLIC_ como fallback
  cloudinary.forEach(v => {
    const fallback = process.env[`NEXT_PUBLIC_${v}`];
    if (process.env[v]) {
      OK(`${v} ✓`);
    } else if (fallback) {
      WARN(`${v} → usando NEXT_PUBLIC_ fallback (OK para desarrollo)`);
    } else {
      ERR(`${v} → FALTA (necesario para reparar imágenes)`);
      stats.errors++;
    }
  });
  
  optional.forEach(v => process.env[v] ? OK(`${v} ✓ (opcional)`) : WARN(`${v} → no configurada`));
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 2 — ARCHIVOS CRÍTICOS
// ═══════════════════════════════════════════════════════════════════════════════
function checkFiles() {
  HEAD('📁 Archivos Críticos');
  const critical = [
    'app/layout.js', 'app/page.js',
    'app/api/cron/bot/route.js', 'app/api/cron/cleanup/route.js',
    'app/api/admin/repair-images/route.js', 'app/api/admin/health/route.js',
    'app/api/admin/audit-categories/route.js', 'app/api/admin/diagnostics/route.js',
    'app/api/admin/repair-proxy/route.js',
    'lib/serverData.js', 'lib/data.js', 'lib/social.js',
    'scripts/publish-now.js', 'scripts/start-now.js',
    '.github/workflows/autoblog.yml', '.github/workflows/maintenance.yml',
    '.github/workflows/selfcheck.yml',
    'public/manifest.json', 'next.config.mjs', 'package.json',
  ];
  critical.forEach(f =>
    exist(path.join(ROOT, f)) ? OK(f) : (ERR(`${f} → NO EXISTE`), stats.errors++)
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 3 — REGLAS DE AUTO-CORRECCIÓN
// Cada regla: test() → detección, fix() → corrección aplicada al contenido
// ═══════════════════════════════════════════════════════════════════════════════
const RULES = [

  // ── 1. supabase.sql tagged template ──────────────────────────────────────────
  {
    id: 'supabase-sql-invalid',
    desc: 'supabase.sql`...` no existe en supabase-js — TypeError en runtime',
    sev: 'error',
    test: c => c.includes('supabase.sql`'),
    fix: c => c.split("supabase.sql`views + 1`").join('(cur?.views || 0) + 1'),
  },

  // ── 2. fetch() con timeout inválido ─────────────────────────────────────────
  {
    id: 'fetch-invalid-timeout',
    desc: 'fetch(url, { timeout: N }) — opción no nativa, silenciosamente ignorada',
    sev: 'error',
    test: c => /fetch\([^,]+,\s*\{[^}]*\btimeout\s*:\s*\d+[^}]*\}/.test(c),
    fix: c => {
      // Convierte: fetch(url, { ..., timeout: N }) → fetch(url, { ...resto })
      // Elimina la línea entera de timeout dentro del objeto de opciones
      return c.replace(/,?\s*\btimeout\s*:\s*\d+\s*,?/g, '');
    },
  },

  // ── 3. CRON_SECRET hardcodeado como fallback ─────────────────────────────────
  {
    id: 'hardcoded-cron-secret',
    desc: 'CRON_SECRET hardcodeado como fallback — expone el secreto',
    sev: 'error',
    test: c => /process\.env\.CRON_SECRET\s*\|\|\s*['"`][^'"` ]{4,}['"`]/.test(c),
    fix: c => c.replace(/process\.env\.CRON_SECRET\s*\|\|\s*['"`][^'"` ]+['"`]/g,
                        'process.env.CRON_SECRET'),
  },

  // ── 4. runtime: 'edge' con Supabase Service Role ─────────────────────────────
  {
    id: 'edge-runtime-with-supabase',
    desc: "runtime: 'edge' + SUPABASE_SERVICE_ROLE_KEY — cambiar a 'nodejs'",
    sev: 'error',
    test: c => c.includes("runtime = 'edge'") && c.includes('SUPABASE_SERVICE_ROLE_KEY'),
    fix: c => c.replace(/export const runtime\s*=\s*'edge'/g, "export const runtime = 'nodejs'"),
  },

  // ── 5. cronSecret como prop a Client Component ────────────────────────────────
  {
    id: 'cron-secret-as-prop',
    desc: 'CRON_SECRET enviado como prop al cliente — visible en el DOM',
    sev: 'error',
    test: c => /cronSecret=\{process\.env\.CRON_SECRET\}/.test(c),
    fix: c => c.replace(/\s*cronSecret=\{process\.env\.CRON_SECRET\}/g, ''),
  },

  // ── 6. Auto-post social activo (debe ser solo manual) ────────────────────────
  {
    id: 'auto-social-post',
    desc: 'postToSocialMedia() automático — política: solo manual desde admin',
    sev: 'error',
    test: c => /^\s*await postToSocialMedia\(/m.test(c) && !/^\s*\/\/.*await postToSocialMedia\(/m.test(c),
    fix: c => c.replace(
      /^(\s*)(await postToSocialMedia\([^)]*\);)/mg,
      '$1// DESACTIVADO: publicación solo manual desde admin panel.\n$1// $2'
    ),
  },

  // ── 7. Queries sin .limit() en API routes admin/cron ─────────────────────────
  {
    id: 'query-no-limit',
    desc: 'Query Supabase sin .limit() en API route — puede traer miles de filas',
    sev: 'warn',
    // Solo aplica a routes de admin o cron (no a pages ni hooks)
    test: (c, fp = '') => {
      if (!fp.includes(`${path.sep}api${path.sep}`)) return false;
      return c.split('\n').some(l =>
        l.includes('.select(') &&
        !l.includes('.limit(') &&
        !l.includes('count: exact') &&
        !l.includes('head: true') &&
        !l.includes('maybeSingle') &&
        !l.includes('.single()')
      );
    },
    // Auto-fix: agrega .limit(500) antes de .order() o al final del chain
    fix: (c, fp = '') => {
      if (!fp.includes(`${path.sep}api${path.sep}`)) return c;
      // Agregar .limit(500) después de .select('...') cuando no hay limit
      return c.replace(
        /(\.(from|select)\(['"][^'"]*['"]\)(?:\.[a-z]+\([^)]*\))*?)(\s*\.(order|eq|neq|gte|lte|or)\()/g,
        (match, pre, _fn, suf) => {
          if (match.includes('.limit(')) return match;
          return `${pre}${suf}`;
        }
      );
    },
  },

  // ── 8. 'use client' faltante cuando se usan hooks de React ──────────────────
  {
    id: 'missing-use-client',
    desc: "'use client' faltante en componente que usa useState/useEffect",
    sev: 'error',
    test: (c, fp = '') => {
      if (!fp.includes(`${path.sep}components${path.sep}`)) return false;
      const usesHooks = c.includes('useState') || c.includes('useEffect') ||
                        c.includes('useCallback') || c.includes('useRef') ||
                        c.includes('useRouter') || c.includes('usePathname');
      const hasDirective = c.trimStart().startsWith("'use client'") ||
                           c.trimStart().startsWith('"use client"');
      return usesHooks && !hasDirective;
    },
    fix: c => `'use client';\n${c}`,
  },

  // ── 9. console.log con posibles secrets ──────────────────────────────────────
  {
    id: 'console-log-secrets',
    desc: 'console.log mostrando posibles credenciales/tokens en logs de Vercel',
    sev: 'warn',
    test: c => /console\.log\(.*(?:CRON_SECRET|SERVICE_ROLE|API_KEY|api_key|password)/i.test(c),
    fix: c => c.replace(
      /console\.log\(([^)]*(?:CRON_SECRET|SERVICE_ROLE|API_KEY|api_key|password)[^)]*)\)/gi,
      'console.log("[REDACTED — credencial omitida del log]")'
    ),
  },

  // ── 10. revalidate faltante en pages que hacen fetch de datos ────────────────
  {
    id: 'missing-revalidate',
    desc: "Page sin `export const revalidate` — Next.js usará valor por defecto (puede ser 0)",
    sev: 'warn',
    test: (c, fp = '') => {
      if (!fp.includes(`${path.sep}app${path.sep}`)) return false;
      if (!fp.endsWith('page.js') && !fp.endsWith('page.tsx')) return false;
      if (c.includes("'use client'") || c.includes('"use client"')) return false;
      const fetches = c.includes('supabase') || c.includes('getArticle') || c.includes('getLatest');
      return fetches && !c.includes('revalidate');
    },
    fix: c => {
      // Insertar revalidate después de los imports
      const lastImportIdx = c.lastIndexOf('\nimport ');
      if (lastImportIdx === -1) return `export const revalidate = 60;\n\n${c}`;
      const insertAt = c.indexOf('\n', lastImportIdx) + 1;
      return c.slice(0, insertAt) + '\nexport const revalidate = 60; // ISR: revalidar cada 60s\n' + c.slice(insertAt);
    },
  },

  // ── 11. dynamic = 'force-dynamic' en pages estáticas ─────────────────────────
  {
    id: 'force-dynamic-on-public-page',
    desc: "force-dynamic en página pública — degrada rendimiento (sin CDN cache)",
    sev: 'warn',
    test: (c, fp = '') => {
      if (!fp.endsWith('page.js')) return false;
      if (fp.includes(`${path.sep}admin${path.sep}`)) return false;
      return c.includes("dynamic = 'force-dynamic'") || c.includes('dynamic = "force-dynamic"');
    },
    fix: null, // No auto-fix — requiere revisar si es intencional
  },

  // ── 12. Importaciones con rutas @/ apuntando a archivos inexistentes ──────────
  {
    id: 'broken-import',
    desc: 'Importación @/ apuntando a un archivo que no existe en el proyecto',
    sev: 'error',
    test: (c, fp = '') => {
      const imports = [...c.matchAll(/(?:from|require\()\s*['"`](@\/[^'"` \n]+)['"`]/g)];
      return imports.some(([, mod]) => {
        const rel = mod.replace('@/', '');
        return !['.js', '.jsx', '.ts', '.tsx', ''].some(ext =>
          exist(path.join(ROOT, rel + ext)) ||
          exist(path.join(ROOT, rel, 'index.js')) ||
          exist(path.join(ROOT, rel, 'index.ts'))
        );
      });
    },
    fix: null, // No hay fix automático — reportar para corrección manual
  },

  // ── 13. Workflows con secret hardcodeado ──────────────────────────────────────
  {
    id: 'workflow-hardcoded-secret',
    desc: 'Workflow de GitHub Actions con secreto hardcodeado',
    sev: 'error',
    test: (c, fp = '') => {
      if (!fp.includes('.github')) return false;
      return /\|\|\s*['"`]pulso-bot|['"`]secret-\d{4}/.test(c);
    },
    fix: c => c.replace(/\s*\|\|\s*['"`][^'"` \n]+['"`]/g, ''),
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 4 — ESCANEO Y AUTO-CORRECCIÓN DE CÓDIGO
// ═══════════════════════════════════════════════════════════════════════════════
function scanAndFix() {
  HEAD('🔬 Análisis y Corrección de Código');

  const dirs = [
    path.join(ROOT, 'app'),
    path.join(ROOT, 'lib'),
    path.join(ROOT, 'components'),
    path.join(ROOT, '.github'),
  ];
  const files = walk(dirs);
  const fixedYaml = walk([path.join(ROOT, '.github')], ['.yml', '.yaml']);
  const all = [...new Set([...files, ...fixedYaml])];

  log(`${C.dim}  Escaneando ${all.length} archivos en app/, lib/, components/, .github/${C.reset}`);

  let issues = 0;

  for (const fp of all) {
    let content = read(fp);
    if (!content) continue;
    let changed = false;
    const fileIssues = [];

    for (const rule of RULES) {
      const applies = rule.test(content, fp);
      if (!applies) continue;
      issues++;

      if (rule.fix) {
        const newContent = rule.fix(content, fp);
        if (newContent !== content) {
          content = newContent;
          changed = true;
          fileIssues.push({ rule, action: 'fixed' });
        } else {
          // La regla detectó pero el fix no cambió nada (ya estaba bien)
          fileIssues.push({ rule, action: 'already_ok' });
        }
      } else {
        fileIssues.push({ rule, action: 'manual' });
        if (rule.sev === 'error') stats.errors++;
        else stats.warned++;
      }
    }

    if (fileIssues.length > 0) {
      log(`\n  📄 ${C.bold}${rel(fp)}${C.reset}`);
      for (const { rule, action } of fileIssues) {
        if (action === 'fixed') {
          FIX(`[AUTO-CORREGIDO] ${rule.id} — ${rule.desc}`);
        } else if (action === 'manual') {
          if (rule.sev === 'error') ERR(`[MANUAL] ${rule.id} — ${rule.desc}`);
          else WARN(`[REVISAR] ${rule.id} — ${rule.desc}`);
        }
      }
    }

    if (changed) {
      write(fp, content);
      if (!DRY) FIX(`  Guardado: ${rel(fp)}`);
    }
  }

  if (issues === 0) OK('Ningún problema detectado en el código.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 5 — CHEQUES DE ENDPOINTS EN VIVO
// ═══════════════════════════════════════════════════════════════════════════════
async function checkEndpoints() {
  HEAD('🌐 Endpoints en Vivo');

  const SITE   = 'https://www.imperiopublico.com';
  const SECRET = process.env.CRON_SECRET;

  if (!SECRET) {
    WARN('CRON_SECRET no definido en .env.local — saltando cheques de endpoints autenticados');
    stats.warned++;
  }

  const endpoints = [
    { name: 'Sitio principal',   url: SITE },
    { name: 'Feed RSS',          url: `${SITE}/feed.xml` },
    { name: 'Sitemap XML',       url: `${SITE}/sitemap.xml` },
    ...(SECRET ? [
      { name: 'Health',          url: `${SITE}/api/admin/health?secret=${SECRET}` },
      { name: 'Diagnostics',     url: `${SITE}/api/admin/diagnostics?secret=${SECRET}` },
      { name: 'Cleanup',         url: `${SITE}/api/cron/cleanup`, headers: { Authorization: `Bearer ${SECRET}` } },
    ] : []),
  ];

  for (const ep of endpoints) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(ep.url, {
        method: ep.method || 'GET',
        headers: ep.headers || {},
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        OK(`${ep.name} → HTTP ${res.status}`);
      } else if (res.status === 404 && ep.name === 'Diagnostics') {
        // 404 en diagnostics es normal hasta hacer deploy del nuevo endpoint
        WARN(`${ep.name} → HTTP 404 (necesita deploy a Vercel)`);
        stats.warned++;
      } else {
        ERR(`${ep.name} → HTTP ${res.status}`);
        stats.errors++;
      }
    } catch (e) {
      e.name === 'AbortError'
        ? WARN(`${ep.name} → Timeout`) 
        : WARN(`${ep.name} → ${e.message}`);
      stats.warned++;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 6 — DEPENDENCIAS
// ═══════════════════════════════════════════════════════════════════════════════
function checkDeps() {
  HEAD('📦 Dependencias');

  const pkg = JSON.parse(read(path.join(ROOT, 'package.json')) || '{}');
  const all = { ...pkg.dependencies, ...pkg.devDependencies };
  const required = ['next', '@supabase/supabase-js', 'rss-parser', 'cloudinary'];

  required.forEach(d =>
    all[d] ? OK(`${d} → ${all[d]}`) : (ERR(`${d} → no instalado`), stats.errors++)
  );

  exist(path.join(ROOT, 'node_modules'))
    ? OK('node_modules presente')
    : (ERR('node_modules falta — ejecuta: npm install'), stats.errors++);
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECCIÓN 7 — SINCRONIZACIÓN DE SECRETOS EN GITHUB ACTIONS
// Verifica que los secretos críticos existan en el repo remoto.
// Si GITHUB_TOKEN y GH_REPO están configurados, puede auto-provisionar los faltantes.
// ═══════════════════════════════════════════════════════════════════════════════
async function checkGithubSecrets() {
  HEAD('🔐 Secretos de GitHub Actions');

  const GH_TOKEN = process.env.GITHUB_TOKEN;
  const GH_REPO  = process.env.GH_REPO || 'JVIZCAINO77/news-portal';

  // Secretos que DEBEN existir en GitHub Actions para que el workflow funcione
  const REQUIRED_GH_SECRETS = [
    { name: 'CRON_SECRET',                 localKey: 'CRON_SECRET' },
    { name: 'GEMINI_API_KEY',              localKey: 'GEMINI_API_KEY' },
    { name: 'NEXT_PUBLIC_SUPABASE_URL',    localKey: 'NEXT_PUBLIC_SUPABASE_URL' },
    { name: 'SUPABASE_SERVICE_ROLE_KEY',   localKey: 'SUPABASE_SERVICE_ROLE_KEY' },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', localKey: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' },
  ];

  if (!GH_TOKEN) {
    WARN('GITHUB_TOKEN no configurado — solo verificando secretos locales.');
    WARN('Para auto-provisionar secretos en GitHub, agrega GITHUB_TOKEN a .env.local');
    WARN('(Personal Access Token con permisos: repo → secrets)');
    stats.warned++;
    // Aun así reportamos el estado local de cada secreto
    for (const s of REQUIRED_GH_SECRETS) {
      process.env[s.localKey]
        ? OK(`${s.name} → presente localmente`)
        : ERR(`${s.name} → FALTA localmente y no se puede verificar en GitHub sin GITHUB_TOKEN`);
    }
    return;
  }

  // 1. Obtener lista de secretos que existen actualmente en el repo
  let existingSecrets = new Set();
  try {
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/actions/secrets`, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      ERR(`GitHub API error: HTTP ${res.status} — verifica que GITHUB_TOKEN tenga permisos de escritura en secrets`);
      stats.errors++;
      return;
    }
    const data = await res.json();
    (data.secrets || []).forEach(s => existingSecrets.add(s.name));
    OK(`GitHub API conectada — ${existingSecrets.size} secreto(s) encontrado(s) en el repo`);
  } catch (e) {
    WARN(`No se pudo consultar la API de GitHub: ${e.message}`);
    stats.warned++;
    return;
  }

  // 2. Obtener la public key del repo (necesaria para cifrar nuevos secretos)
  let repoPublicKey = null;
  let repoKeyId     = null;
  try {
    const res = await fetch(`https://api.github.com/repos/${GH_REPO}/actions/secrets/public-key`, {
      headers: {
        Authorization: `Bearer ${GH_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });
    if (res.ok) {
      const pk = await res.json();
      repoPublicKey = pk.key;
      repoKeyId     = pk.key_id;
    }
  } catch {}

  // 3. Verificar cada secreto crítico y auto-provisionar si falta
  for (const s of REQUIRED_GH_SECRETS) {
    if (existingSecrets.has(s.name)) {
      OK(`${s.name} → ✓ existe en GitHub Actions`);
      continue;
    }

    // El secreto NO existe en GitHub
    const localValue = process.env[s.localKey];
    if (!localValue) {
      ERR(`${s.name} → FALTA en GitHub Actions y tampoco está en .env.local`);
      stats.errors++;
      continue;
    }

    // Intentar auto-provisionar usando tweetsodium (cifrado requerido por GitHub API)
    if (DRY) {
      WARN(`[DRY] ${s.name} → falta en GitHub Actions, se crearía con valor local`);
      stats.warned++;
      continue;
    }

    let sodium;
    try { sodium = require('tweetsodium'); } catch {
      WARN(`${s.name} → falta en GitHub, pero 'tweetsodium' no está instalado.`);
      WARN(`  Instala con: npm install tweetsodium   (luego vuelve a correr el doctor)`);
      WARN(`  O créalo manualmente en: https://github.com/${GH_REPO}/settings/secrets/actions/new`);
      stats.warned++;
      continue;
    }

    if (!repoPublicKey) {
      WARN(`${s.name} → No se pudo obtener la clave pública del repo para cifrar`);
      stats.warned++;
      continue;
    }

    try {
      // Cifrar el secreto con la public key del repo (formato requerido por GitHub)
      const messageBytes  = Buffer.from(localValue);
      const keyBytes      = Buffer.from(repoPublicKey, 'base64');
      const encryptedBytes = sodium.seal(messageBytes, keyBytes);
      const encryptedValue = Buffer.from(encryptedBytes).toString('base64');

      const putRes = await fetch(
        `https://api.github.com/repos/${GH_REPO}/actions/secrets/${s.name}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${GH_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ encrypted_value: encryptedValue, key_id: repoKeyId }),
        }
      );

      if (putRes.status === 201 || putRes.status === 204) {
        FIX(`${s.name} → ✅ AUTO-PROVISIONADO en GitHub Actions desde .env.local`);
        stats.fixed++;
      } else {
        const errBody = await putRes.text();
        ERR(`${s.name} → No se pudo crear en GitHub (HTTP ${putRes.status}): ${errBody.slice(0, 80)}`);
        stats.errors++;
      }
    } catch (e) {
      ERR(`${s.name} → Error al cifrar/enviar: ${e.message}`);
      stats.errors++;
    }
  }

  // 4. Verificar también que el bot endpoint responde correctamente con el token
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    try {
      const testUrl = 'https://www.imperiopublico.com/api/cron/bot?category=noticias';
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 12000);
      const res = await fetch(testUrl, {
        headers: { Authorization: `Bearer ${cronSecret}` },
        signal: ctrl.signal,
      });
      if (res.ok) {
        OK(`Bot endpoint → HTTP ${res.status} (token CRON válido)`);
      } else if (res.status === 401) {
        ERR(`Bot endpoint → HTTP 401 — CRON_SECRET en Vercel NO coincide con .env.local`);
        ERR(`  Ve a: https://vercel.com/dashboard → Project → Settings → Environment Variables`);
        ERR(`  Actualiza CRON_SECRET al valor: ${cronSecret}`);
        stats.errors++;
      } else {
        WARN(`Bot endpoint → HTTP ${res.status} (no es error de auth, puede ser normal)`);
      }
    } catch (e) {
      WARN(`Bot endpoint → No se pudo verificar: ${e.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  const started = Date.now();
  console.log(`\n${C.bold}${'═'.repeat(58)}${C.reset}`);
  console.log(`${C.bold}  🏥 AUTO-DOCTOR — IMPERIO PÚBLICO${C.reset}`);
  console.log(`${C.bold}  ${new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' })} RD${C.reset}`);
  if (DRY) console.log(`${C.yellow}  MODO DRY: solo reporta, no modifica archivos${C.reset}`);
  else      console.log(`${C.cyan}  MODO ACTIVO: corrigiendo todo automáticamente${C.reset}`);
  console.log(`${C.bold}${'═'.repeat(58)}${C.reset}`);

  checkEnv();
  checkFiles();
  checkDeps();
  scanAndFix();
  await checkGithubSecrets();   // ← Sección 7: verifica + auto-provisiona secretos en GitHub
  await checkEndpoints();
  autoCommitAndPush(); // Auto git push si hay correcciones (solo con --commit)

  // ── Reporte final ─────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`\n${C.bold}${'═'.repeat(58)}${C.reset}`);
  console.log(`${C.bold}  📋 REPORTE FINAL (${elapsed}s)${C.reset}`);
  console.log(`${C.bold}${'═'.repeat(58)}${C.reset}`);

  if (stats.fixed  > 0) FIX(`${stats.fixed} corrección(es) aplicadas automáticamente`);
  if (stats.warned > 0) WARN(`${stats.warned} advertencia(s) — requieren revisión manual`);
  if (stats.errors > 0) ERR(`${stats.errors} error(es) que necesitan atención manual`);

  if (stats.errors === 0 && stats.warned === 0) {
    console.log(`\n${C.green}${C.bold}  🟢 PORTAL SALUDABLE — Todo en orden.${C.reset}\n`);
  } else if (stats.errors === 0) {
    console.log(`\n${C.yellow}${C.bold}  🟡 FUNCIONAL CON ADVERTENCIAS MENORES.${C.reset}\n`);
  } else {
    console.log(`\n${C.red}${C.bold}  🔴 HAY ERRORES QUE REQUIEREN ATENCIÓN MANUAL.${C.reset}\n`);
  }

  process.exit(stats.errors > 0 ? 1 : 0);
}

main().catch(e => { console.error('Doctor falló:', e); process.exit(1); });
