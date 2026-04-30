// scratch/diagnose_admin.js — Diagnóstico del panel admin
// Ejecutar con: node scratch/diagnose_admin.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function diagnose() {
  console.log('=== DIAGNÓSTICO ADMIN ===\n');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service Key (primeros 20 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20) + '...\n');

  // 1. Verificar tabla articles
  console.log('1. Probando tabla articles...');
  const { data: arts, error: artErr } = await supabase
    .from('articles')
    .select('id, title, publishedAt')
    .order('publishedAt', { ascending: false })
    .limit(3);

  if (artErr) {
    console.error('   ❌ ERROR articles:', artErr.message);
  } else {
    console.log(`   ✅ OK — ${arts.length} artículos recientes`);
    arts.forEach(a => console.log(`      - ${a.title?.slice(0, 60)}`));
  }

  // 2. Verificar tabla profiles
  console.log('\n2. Probando tabla profiles...');
  const { data: profs, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .limit(5);

  if (profErr) {
    console.error('   ❌ ERROR profiles:', profErr.message);
  } else {
    console.log(`   ✅ OK — ${profs.length} perfiles`);
    profs.forEach(p => console.log(`      - ${p.full_name} (${p.role})`));
  }

  // 3. Verificar tabla settings
  console.log('\n3. Probando tabla settings...');
  const { data: sets, error: setErr } = await supabase
    .from('settings')
    .select('*')
    .limit(5);

  if (setErr) {
    console.error('   ❌ ERROR settings:', setErr.message);
    console.log('   ℹ️  La tabla "settings" NO existe o no es accesible.');
    console.log('   ℹ️  Esto causa el crash del admin layout.');
  } else {
    console.log(`   ✅ OK — ${sets.length} registros en settings`);
    sets.forEach(s => console.log(`      - ${s.key}: ${JSON.stringify(s.value)}`));
  }

  // 4. Verificar columnas de articles
  console.log('\n4. Verificando columnas de articles...');
  const { data: oneArt, error: oneErr } = await supabase
    .from('articles')
    .select('*')
    .limit(1)
    .single();

  if (oneErr && oneErr.code !== 'PGRST116') {
    console.error('   ❌ ERROR:', oneErr.message);
  } else if (oneArt) {
    const cols = Object.keys(oneArt);
    console.log('   ✅ Columnas:', cols.join(', '));
    const missing = ['featured', 'trending', 'slug', 'image', 'excerpt'].filter(c => !cols.includes(c));
    if (missing.length) {
      console.log('   ⚠️  Columnas FALTANTES:', missing.join(', '));
    } else {
      console.log('   ✅ Todas las columnas requeridas presentes');
    }
  }

  console.log('\n=== FIN DIAGNÓSTICO ===');
}

diagnose().catch(console.error);
