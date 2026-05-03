import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadAndUpdate() {
  const imagePath = path.join(__dirname, '../public/images/news/tragedia-pedro-brand.jpg');

  if (!fs.existsSync(imagePath)) {
    console.error('Image file not found at:', imagePath);
    process.exit(1);
  }

  console.log('📤 Uploading image to Cloudinary via multipart...');

  const fileBuffer = fs.readFileSync(imagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });

  const formData = new FormData();
  formData.append('file', blob, 'tragedia-pedro-brand.jpg');
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error('❌ Cloudinary error:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const cloudinaryUrl = data.secure_url;
  console.log('✅ Uploaded to Cloudinary:', cloudinaryUrl);

  // Update the article in Supabase
  const { data: updated, error } = await supabase
    .from('articles')
    .update({ image: cloudinaryUrl })
    .eq('slug', 'tragedia-pedro-brand-muere-nino-cisterna')
    .select('slug, image');

  if (error) {
    console.error('❌ Supabase update error:', error);
  } else {
    console.log('✅ Article updated:', updated);
  }
}

uploadAndUpdate();
