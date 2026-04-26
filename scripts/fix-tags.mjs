/**
 * fix-tags.mjs — Diagnóstico y corrección de tags en Supabase
 * Uso: node scripts/fix-tags.mjs
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vprjbntwebhzjjcnlztc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwcmpibnR3ZWJoempqY25senRjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTA4OTMwNSwiZXhwIjoyMDkwNjY1MzA1fQ.zdwco4O57L2X2xzuj0H28plAxWqRF6vwYJIl9qGLhGM';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map(t => String(t).trim().replace(/^#+/, '').replace(/[_\s]+/g, '')).filter(Boolean);
  }
  if (typeof raw !== 'string') return [];
  const str = raw.trim();

  // PostgreSQL format: {"a","b"}
  if (str.startsWith('{') && str.endsWith('}')) {
    return str.slice(1, -1)
      .split(',')
      .map(t => t.replace(/^"|"$/g, '').trim().replace(/^#+/, '').replace(/[_\s]+/g, ''))
      .filter(Boolean);
  }

  // JSON format: ["a","b"]
  if (str.startsWith('[')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        return parsed.map(t => String(t).trim().replace(/^#+/, '').replace(/[_\s]+/g, '')).filter(Boolean);
      }
    } catch { /* fall through */ }
  }

  // Plain comma-separated
  return str.split(',').map(t => t.trim().replace(/^#+/, '').replace(/[_\s]+/g, '')).filter(Boolean);
}

async function main() {
  console.log('🔍 Obteniendo artículos con tags...\n');

  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, tags')
    .not('tags', 'is', null)
    .order('publishedAt', { ascending: false })
    .limit(50);

  if (error) {
    console.error('❌ Error al consultar Supabase:', error.message);
    process.exit(1);
  }

  console.log(`📋 Total artículos con tags: ${articles.length}\n`);
  
  let fixed = 0;
  let broken = 0;

  for (const article of articles) {
    const raw = article.tags;
    const isArray = Array.isArray(raw);
    const parsed = parseTags(raw);

    if (!isArray && parsed.length > 0) {
      broken++;
      console.log(`🔧 ROTO → "${article.title.slice(0, 50)}"`);
      console.log(`   Raw:    ${JSON.stringify(raw)}`);
      console.log(`   Parsed: ${JSON.stringify(parsed)}`);

      // Fix it
      const { error: updateError } = await supabase
        .from('articles')
        .update({ tags: parsed })
        .eq('id', article.id);

      if (updateError) {
        console.log(`   ❌ Error al actualizar: ${updateError.message}`);
      } else {
        fixed++;
        console.log(`   ✅ Corregido!\n`);
      }
    } else if (isArray && parsed.length > 0) {
      console.log(`✅ OK → "${article.title.slice(0, 50)}" → ${JSON.stringify(parsed)}`);
    }
  }

  console.log(`\n📊 Resumen:`);
  console.log(`   - Artículos con tags rotos encontrados: ${broken}`);
  console.log(`   - Artículos corregidos: ${fixed}`);
  console.log(`   - Artículos ya correctos: ${articles.length - broken}`);
}

main().catch(console.error);
