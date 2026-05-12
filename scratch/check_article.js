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

async function checkArticle() {
  const { data: articles, error } = await supabase
    .from('articles')
    .select('*')
    .ilike('title', '%2028%');

  if (error) {
    console.error('Error fetching article:', error);
    return;
  }

  if (articles && articles.length > 0) {
    console.log('--- ARTICLE DETAILS ---');
    console.log(JSON.stringify(articles[0], null, 2));
    console.log('-----------------------');
  } else {
    console.log('Article not found.');
  }
}

checkArticle();
