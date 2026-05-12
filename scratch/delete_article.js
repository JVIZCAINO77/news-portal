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

async function deleteArticle() {
  // Find the article first to be sure
  const { data: articles, error: fetchError } = await supabase
    .from('articles')
    .select('id, title, slug')
    .ilike('title', '%2028%');

  if (fetchError) {
    console.error('Error fetching article:', fetchError);
    return;
  }

  if (articles && articles.length > 0) {
    console.log(`Found ${articles.length} articles to delete:`);
    for (const art of articles) {
      console.log(`- [${art.id}] ${art.title} (${art.slug})`);
      
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', art.id);

      if (deleteError) {
        console.error(`Error deleting article ${art.id}:`, deleteError);
      } else {
        console.log(`✅ Article ${art.id} deleted successfully.`);
      }
    }
  } else {
    console.log('No articles found with "2028" in the title.');
  }
}

deleteArticle();
