
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

async function internalizeBatch() {
  console.log('Fetching external images (Batch of 20)...');
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, image, title')
    .not('image', 'ilike', '%cloudinary.com%')
    .not('image', 'ilike', '%pollinations.ai%')
    .limit(20);

  if (error) {
    console.error('Supabase Error:', error);
    return;
  }

  if (articles.length === 0) {
    console.log('No external images found.');
    return;
  }

  console.log(`Processing ${articles.length} articles...`);

  for (const article of articles) {
    try {
      console.log(`- Internalizing: ${article.title.slice(0, 40)}...`);
      
      const curlCmd = `curl.exe -s -X POST https://api.cloudinary.com/v1_1/${cloudName}/image/upload -F "file=${article.image}" -F "upload_preset=${uploadPreset}"`;
      
      const responseText = execSync(curlCmd).toString();
      const res = JSON.parse(responseText);

      if (res && res.secure_url) {
        const newUrl = res.secure_url;
        const { error: updateError } = await supabase
          .from('articles')
          .update({ image: newUrl })
          .eq('id', article.id);

        if (updateError) {
          console.error(`  [!] DB Update failed:`, updateError.message);
        } else {
          console.log(`  [+] Internalized: ${newUrl.slice(0, 50)}...`);
        }
      } else {
        console.warn(`  [?] Cloudinary failed for: ${article.image}`);
      }
    } catch (err) {
      console.error(`  [X] Error:`, err.message);
    }
  }

  console.log('Batch complete.');
}

internalizeBatch();
