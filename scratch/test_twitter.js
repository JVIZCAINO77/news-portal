require('dotenv').config({ path: '.env.local' });
const { createHmac } = require('crypto');

const method = 'POST';
const url = 'https://api.twitter.com/2/tweets';
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

const oauthParams = {
  oauth_consumer_key: process.env.TWITTER_API_KEY,
  oauth_nonce: nonce,
  oauth_signature_method: 'HMAC-SHA1',
  oauth_timestamp: timestamp,
  oauth_token: process.env.TWITTER_ACCESS_TOKEN,
  oauth_version: '1.0',
};

const paramStr = Object.keys(oauthParams).sort()
  .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`).join('&');

const baseStr = [method, encodeURIComponent(url), encodeURIComponent(paramStr)].join('&');
const signingKey = `${encodeURIComponent(process.env.TWITTER_API_SECRET)}&${encodeURIComponent(process.env.TWITTER_ACCESS_SECRET)}`;
const signature = createHmac('sha1', signingKey).update(baseStr).digest('base64');

const authHeader = 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: signature })
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(', ');

const tweetText = [
  '🧪 Prueba de auto-post — Imperio Público Bot activado 📰',
  '',
  'El sistema de publicación automática en redes sociales está en línea.',
  'Noticias de República Dominicana 🇩🇴 publicadas al instante.',
  '',
  '🔗 imperiopublico.com',
  '',
  '#NoticiasRD #ImperioPublico #RepublicaDominicana'
].join('\n');

console.log('🐦 Enviando tweet...');
console.log('   API Key (6):', process.env.TWITTER_API_KEY?.slice(-6));
console.log('   Token (6):', process.env.TWITTER_ACCESS_TOKEN?.slice(-6));

fetch(url, {
  method,
  headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: tweetText }),
})
.then(r => r.json())
.then(data => {
  if (data.data?.id) {
    console.log('\n✅ ¡TWEET PUBLICADO!');
    console.log('   Tweet ID:', data.data.id);
    console.log('   URL: https://x.com/Imperiopublico/status/' + data.data.id);
  } else {
    console.log('\n❌ Error:', JSON.stringify(data, null, 2));
  }
})
.catch(e => console.error('❌ Error de red:', e.message));
