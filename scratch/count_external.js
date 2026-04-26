
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function countExternalImages() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, image')
    .not('image', 'ilike', '%cloudinary.com%')
    .not('image', 'ilike', '%pollinations.ai%');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} articles with external images.`);
  if (data.length > 0) {
    console.log('Sample images:');
    data.slice(0, 5).forEach(a => console.log(`- ${a.image}`));
  }
}

countExternalImages();
