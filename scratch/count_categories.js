
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceRole);

async function countCategories() {
  const { data, error } = await supabase
    .from('articles')
    .select('category');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const counts = data.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  console.log('Category Counts:', counts);
}

countCategories();
