'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('No autorizado');

  const fullName = formData.get('fullName');
  const avatarFile = formData.get('avatar');

  let avatarUrl = formData.get('currentAvatarUrl');

  // Si hay una nueva imagen, subirla
  if (avatarFile && avatarFile.size > 0) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    
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
      avatarUrl = publicUrlData?.publicUrl || avatarUrl;
    }
  }

  // Actualizar tabla profiles
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/admin', 'layout');
  revalidatePath('/admin/perfil');
  return { success: true };
}
