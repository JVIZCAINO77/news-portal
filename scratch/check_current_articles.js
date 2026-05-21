
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function checkArticles() {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const start = new Date(today + 'T00:00:00-04:00').toISOString();
  const end   = new Date(today + 'T23:59:59-04:00').toISOString();

  const { data, error } = await supabase
    .from('articles')
    .select('id, title, category, publishedAt, slug, source_link')
    .gte('publishedAt', start)
    .lte('publishedAt', end)
    .order('publishedAt', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total published today: ${data.length}`);
  data.forEach((a, i) => {
    console.log(`${i+1}. [${a.category}] "${a.title}" (slug: ${a.slug})`);
  });
}

checkArticles();
