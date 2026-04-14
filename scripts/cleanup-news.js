import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const slugsToDelete = [
  'fallece-carlos-batista-matos',
  'univision-sony-premier-alofoke',
  'alerta-economica-crisis-rd',
  'adan-caceres-caso-coral',
  'artemis-ii-astronautas',
  'agricultura-crisis-agropecuaria',
  'alofoke-record-youtube',
  'coe-alerta-roja-norte'
];

async function cleanup() {
  console.log('--- Limpiando Noticias Sembradas ---');
  const { error } = await supabase
    .from('articles')
    .delete()
    .in('slug', slugsToDelete);

  if (error) {
    console.error('Error al limpiar:', error);
  } else {
    console.log('✅ Noticias eliminadas correctamente.');
  }
}

cleanup();
