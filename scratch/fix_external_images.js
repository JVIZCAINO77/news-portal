// scratch/fix_external_images.js — Sube imágenes externas a Cloudinary (unsigned upload)
require('dotenv').config({ path: '.env.local' });
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkkw77byz';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'news_portal';

// Subir imagen a Cloudinary por URL (sin API key — usa upload preset)
async function uploadToCloudinary(imageUrl) {
  const formData = `file=${encodeURIComponent(imageUrl)}&upload_preset=${UPLOAD_PRESET}`;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(formData),
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(json.error?.message || JSON.stringify(json)));
        } catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(formData);
    req.end();
  });
}

async function main() {
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title, image')
    .not('image', 'is', null)
    .order('publishedAt', { ascending: false })
    .limit(300);

  const external = articles.filter(a =>
    !a.image.includes('cloudinary.com') &&
    !a.image.includes('unsplash.com') &&
    a.image.startsWith('http')
  );

  console.log(`\n📸 ${external.length} imágenes externas a migrar a Cloudinary:\n`);
  external.forEach(a => console.log(` - ${a.image.slice(0, 80)}`));
  console.log('');

  let ok = 0, fail = 0;

  for (const article of external) {
    console.log(`⬆️  "${article.title?.slice(0, 50)}"`);
    try {
      const cloudUrl = await uploadToCloudinary(article.image);
      console.log(`   ✅ ${cloudUrl}`);

      const { error } = await supabase
        .from('articles')
        .update({ image: cloudUrl })
        .eq('id', article.id);

      if (error) { console.error(`   ❌ BD:`, error.message); fail++; }
      else { ok++; }

      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.error(`   ❌ Upload falló:`, err.message);
      fail++;
    }
  }

  console.log(`\n✅ Completado — ${ok} migradas, ${fail} fallidas.`);
}

main().catch(console.error);
