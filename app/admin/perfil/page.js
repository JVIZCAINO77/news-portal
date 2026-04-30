export const dynamic = 'force-dynamic';

// app/admin/perfil/page.js — Centro de Gestión Personal (Imperio Público 2.0)
import { createClient } from '@/lib/supabase/server';
import ProfileForm from './ProfileForm';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Mi Perfil Editorial | Imperio Público Admin',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) notFound();

  // Obtenemos el perfil completo (usando el cliente admin para asegurar acceso)
  const { createClient: createAdminClient } = await import('@supabase/supabase-js');
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return (
    <div className="bg-red-50 p-10 border border-red-100">
      <h1 className="text-xl font-black text-red-600 uppercase tracking-tighter">Error de Perfil</h1>
      <p className="text-sm text-red-400 mt-2 italic">No se ha encontrado una entrada en la base de datos para tu usuario. Contacta con soporte técnico.</p>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <header>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-red-600 mb-2 italic">Gestión de Identidad</p>
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black leading-none">
          Mi Perfil <span className="text-gray-200">Editorial</span>
        </h1>
        <div className="h-2 w-24 bg-black mt-6"></div>
      </header>

      <section className="animate-fade-up">
        <ProfileForm profile={{ ...profile, email: user.email }} />
      </section>
    </div>
  );
}
