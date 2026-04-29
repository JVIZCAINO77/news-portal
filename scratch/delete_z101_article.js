const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function deleteZ101Article() {
  const { data, error } = await supabase
    .from('articles')
    .delete()
    .like('source_link', '%z101digital.com%')
    .select('title, source_link');

  if (error) {
    console.error('Error al eliminar:', error);
  } else {
    console.log('Artículos eliminados:', data);
  }
}

deleteZ101Article();
