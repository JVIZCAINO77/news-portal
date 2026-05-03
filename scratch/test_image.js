
const fetch = require('node-fetch');

async function testImage() {
  const url = 'https://diariodominicano.com/wp-content/uploads/2025/04/Ramon-Ceballo.webp';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      }
    });
    console.log('Status:', res.status);
    console.log('Headers:', JSON.stringify(res.headers.raw(), null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testImage();
