
const dotenv = require('dotenv');
const path = require('path');
const fetch = require('node-fetch'); // Next.js has fetch built-in, but for script we might need this

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testCloudinaryUrlUpload() {
  const imageUrl = 'https://n.com.do/wp-content/uploads/2026/04/OBR3CDMTEBGUBHAIOE26HUNYM4.jpg';
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  console.log(`Uploading ${imageUrl} to ${cloudName}...`);

  const formData = new URLSearchParams();
  formData.append('file', imageUrl);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const data = await response.json();
  if (response.ok) {
    console.log('Success!', data.secure_url);
  } else {
    console.error('Failed:', data);
  }
}

testCloudinaryUrlUpload();
