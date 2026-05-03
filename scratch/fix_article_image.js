import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Find and update the article
const cloudinaryUrl = 'https://res.cloudinary.com/dkkw77byz/image/upload/v1777837102/wmcdqqmjzdznuhudq5nx.jpg';

// Find by title keyword
const { data: articles, error } = await supabase
  .from('articles')
  .select('id, slug, title, image')
  .ilike('title', '%Pedro Brand%');

console.log('Found articles:', JSON.stringify(articles, null, 2));

if (articles && articles.length > 0) {
  const id = articles[0].id;
  const { data: updated, error: updateError } = await supabase
    .from('articles')
    .update({ image: cloudinaryUrl })
    .eq('id', id)
    .select('id, slug, image');
  
  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('✅ Updated:', updated);
  }
}
