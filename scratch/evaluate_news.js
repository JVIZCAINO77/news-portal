require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkNews() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, category, publishedAt, author, source_link')
    .gte('publishedAt', today.toISOString())
    .order('publishedAt', { ascending: false });

  if (error) {
    console.error("Error fetching articles:", error);
    return;
  }

  console.log(`Found ${data.length} articles published today.`);
  
  const botArticles = data; // All for now

  const categories = {};
  botArticles.forEach(a => {
    categories[a.category] = (categories[a.category] || 0) + 1;
  });

  console.log("\nArticles by Category:");
  for (const [cat, count] of Object.entries(categories)) {
    console.log(`- ${cat}: ${count}`);
  }

  const noticiasArticles = botArticles.filter(a => a.category === 'noticias');
  
  console.log(`\n'noticias' published today: ${noticiasArticles.length}`);
  noticiasArticles.forEach(a => {
    console.log(`- [${a.publishedAt}] (${a.author}) ${a.title}\n  Source: ${a.source_link}`);
  });
}

checkNews();
