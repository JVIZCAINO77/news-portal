
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateImage() {
  const { data, error } = await supabase
    .from('articles')
    .update({ image: '/images/news/tragedia-pedro-brand.jpg' })
    .eq('slug', 'tragedia-pedro-brand-muere-nino-cisterna')
    .select();

  if (error) {
    console.error('Error updating image:', error);
  } else {
    console.log('Image updated successfully:', data);
  }
}

updateImage();
