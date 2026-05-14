const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testAllKeys() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

  console.log(`Testing ${keys.length} keys...`);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    console.log(`\n--- Key ${i + 1} (...${key.slice(-6)}) ---`);
    
    for (const model of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: "Hola, di 'OK'" }] }] }),
        });
        const data = await res.json();
        if (data.error) {
          console.log(`[${model}] ❌ ${data.error.message}`);
        } else {
          console.log(`[${model}] ✅ OK`);
        }
      } catch (e) {
        console.log(`[${model}] ❌ Error: ${e.message}`);
      }
    }
  }
}

testAllKeys();
