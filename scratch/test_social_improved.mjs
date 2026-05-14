import 'dotenv/config';
import { postToSocialMedia } from '../lib/social.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Artículo real más reciente con imagen Cloudinary
const { data } = await supabase
  .from('articles')
  .select('id, title, slug, excerpt, category, image')
  .like('image', '%cloudinary%')
  .order('publishedAt', { ascending: false })
  .limit(1)
  .single();

console.log('📰 Artículo:', data.title);
console.log('📂 Categoría:', data.category);
console.log('🖼️  Imagen:', data.image?.slice(0, 70) + '...');
console.log('🔗 URL:', 'https://imperiopublico.com/articulo/' + data.slug);
console.log('');

await postToSocialMedia(data);
console.log('\n✅ Proceso completado.');
