// scripts/create-admin.js — Script to create the Initial Admin for Imperio Público 2.0
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Critical: Needs service role to bypass auth confirm and set roles
);

async function createAdmin(email, password, fullName) {
  console.log(`🚀 Creando Usuario Administrador: ${email}`);

  // 1. Create User in Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: fullName }
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('⚠️ El usuario ya existe. Intentando actualizar rol...');
      // Logic to find existing user and update role
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const existingUser = users.find(u => u.email === email);
      if (existingUser) {
        await updateProfile(existingUser.id, fullName);
      }
    } else {
      console.error('❌ Error creando auth:', authError.message);
      return;
    }
  } else {
    // 2. Assign Admin Role in Profiles
    await updateProfile(authData.user.id, fullName);
  }
}

async function updateProfile(userId, fullName) {
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ 
      id: userId, 
      full_name: fullName, 
      role: 'admin',
      updated_at: new Date().toISOString()
    });

  if (profileError) {
    console.error('❌ Error asignando rol admin:', profileError.message);
  } else {
    console.log('✅ ¡Administrador creado y configurado con éxito!');
  }
}

// Credenciales solicitadas por el usuario
const ADMIN_EMAIL = 'admin@imperiopublico.com';
const ADMIN_PASS = 'ImperioAdmin2026!';
const ADMIN_NAME = 'Director General';

createAdmin(ADMIN_EMAIL, ADMIN_PASS, ADMIN_NAME);
