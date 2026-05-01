
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkArticle() {
  const { data, error } = await supabase
    .from('articles')
    .select('title, publishedAt')
    .ilike('title', '%Cuba%');

  if (error) {
    console.error('Error fetching articles:', error.message);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

checkArticle();
