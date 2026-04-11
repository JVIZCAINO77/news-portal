// app/admin/usuarios/actions.js — Server Actions para gestión de usuarios (Imperio Público 2.0)
'use server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createEditorUser(formData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');

  // 1. Verificar que el usuario actual tenga permisos de Admin
  const supabaseServer = await createServerClient();
  const { data: { user: currentUser } } = await supabaseServer.auth.getUser();

  if (!currentUser) throw new Error('No autorizado');

  const { data: profile } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    throw new Error('Solo los administradores pueden crear usuarios.');
  }

  // 2. Cliente de Supabase con Service Role (Gestión de Auth)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 3. Crear usuario en Auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  if (authError) {
    return { error: authError.message };
  }

  // 4. Crear perfil en la tabla 'profiles' (El trigger SQL debería hacerlo, pero aseguramos rol)
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      full_name: name,
      role: 'editor',
      updated_at: new Date().toISOString()
    });

  if (profileError) {
     return { error: `Usuario creado pero fallo perfil: ${profileError.message}` };
  }

  revalidatePath('/admin/usuarios');
  return { success: true };
}
