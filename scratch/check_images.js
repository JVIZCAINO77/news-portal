const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentImages() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, title, source_link, image, publishedAt')
    .order('publishedAt', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching articles:', error);
    return;
  }

  console.log('Recent articles and their images:');
  for (const article of data) {
    let sourceHost = 'Unknown';
    try {
      if (article.source_link) {
        sourceHost = new URL(article.source_link).hostname;
      }
    } catch (e) {}

    const isPollinations = article.image && article.image.includes('pollinations.ai');
    console.log(`- Title: ${article.title}`);
    console.log(`  Date: ${article.publishedAt}`);
    console.log(`  Source: ${sourceHost}`);
    console.log(`  Image: ${article.image}`);
    console.log('---');
  }
}

checkRecentImages();
