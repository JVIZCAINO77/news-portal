// app/admin/usuarios/actions.js — Server Actions para gestión de usuarios (Imperio Público 2.0)
'use server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createEditorUser(formData) {
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  const avatarFile = formData.get('avatar');

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

  // 4. Subir avatar a Supabase Storage si se proporcionó
  let avatarUrl = null;
  if (avatarFile && avatarFile.size > 0) {
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${authUser.user.id}.${fileExt}`;
    const arrayBuffer = await avatarFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatares')
      .upload(fileName, buffer, {
        contentType: avatarFile.type,
        upsert: true,
      });

    if (!uploadError) {
      const { data: publicUrlData } = supabaseAdmin.storage
        .from('avatares')
        .getPublicUrl(fileName);
      avatarUrl = publicUrlData?.publicUrl || null;
    }
  }

  // 5. Crear perfil en la tabla 'profiles' con avatar_url
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: authUser.user.id,
      full_name: name,
      role: 'editor',
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString()
    });

  if (profileError) {
     return { error: `Usuario creado pero falló perfil: ${profileError.message}` };
  }

  revalidatePath('/admin/usuarios');
  return { success: true };
}
