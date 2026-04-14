import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const keywords = [
  'alofoke',
  'carlos-batista',
  'artemis',
  'adan-c-ceres',
  'adan-caceres',
  'coe-alerta',
  'alerta-econ',
  'agricultura-cris',
  'agricultura-amenazan'
];

async function cleanup() {
  console.log('--- Iniciando Limpieza Agresiva de Noticias Sembradas ---');
  
  for (const keyword of keywords) {
    const { data, error } = await supabase
      .from('articles')
      .delete()
      .ilike('slug', `%${keyword}%`);
    
    if (error) {
      console.error(`Error eliminando ${keyword}:`, error);
    } else {
      console.log(`✅ Eliminadas noticias con: ${keyword}`);
    }
  }
  
  console.log('--- Limpieza Completada ---');
}

cleanup();
