
async function test() {
  const url = 'https://diariodominicano.com/wp-content/uploads/2025/04/Ramon-Ceballo.webp';
  const headersSet = [
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Referer': new URL(url).origin,
    },
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    }
  ];

  for (const headers of headersSet) {
    console.log('Testing with headers:', JSON.stringify(headers));
    try {
      const res = await fetch(url, { headers });
      console.log('Status:', res.status);
      console.log('Content-Type:', res.headers.get('content-type'));
    } catch (err) {
      console.error('Error:', err.message);
    }
    console.log('---');
  }
}

test();
