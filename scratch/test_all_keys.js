require('dotenv').config({ path: '.env.local' });

const newKeys = [
  'AIzaSyAGioECJJ5VUF7pbl1L6ww17SxZcNwvsis',
  'AIzaSyB5W6pO8_NnoCGG_D_H4kJzFZJ3l6OJxZA',
  'AIzaSyBqrsXI8jbWwvX4Zy57-psWLXAx0B_PTrU',
  'AIzaSyAbsuNFrR5IkHdD7o9PY7g31KL3sQHZvaU',
  'AIzaSyA3Sa-WnUTeKWcCu5Uetxo3AGa_KFemfSg',
  'AIzaSyBaHgkwpdtmPTuaWUdxyu3ja6U8OxdLdp4',
];

const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];

async function testKey(key, model) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'Di hola en una palabra' }] }] }),
    }
  );
  const data = await res.json();
  if (data.error) {
    const isQuota = data.error.code === 429 || data.error.status === 'RESOURCE_EXHAUSTED';
    const isInvalid = data.error.code === 400;
    return { ok: false, reason: isQuota ? 'cuota agotada' : isInvalid ? 'clave inválida' : data.error.message };
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return { ok: true, text };
}

async function main() {
  const working = [];
  for (const key of newKeys) {
    let found = false;
    for (const model of models) {
      process.stdout.write(`Probando ...${key.slice(-8)} (${model})... `);
      const result = await testKey(key, model);
      if (result.ok) {
        console.log(`✅ FUNCIONA → "${result.text.trim()}"`);
        working.push(key);
        found = true;
        break;
      } else {
        console.log(`❌ ${result.reason}`);
      }
    }
    if (!found) {
      // not working with any model
    }
  }

  console.log(`\n═══════════════════════════`);
  console.log(`Claves funcionales: ${working.length}/${newKeys.length}`);
  if (working.length > 0) {
    console.log('Claves OK:', working.join(','));
  }
}

main().catch(console.error);
