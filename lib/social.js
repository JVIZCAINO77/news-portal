/**
 * lib/social.js — Auto-publicación en RRSS cuando el bot publica un artículo.
 * Activa automáticamente si las variables de entorno están configuradas en Vercel.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://imperiopublico.com';

/**
 * Publica un artículo en todas las redes sociales configuradas.
 * @param {Object} article - El objeto del artículo recién insertado en BD
 */
export async function postToSocialMedia(article) {
  const articleUrl = `${SITE_URL}/articulo/${article.slug}`;

  // Mensaje para texto plano (Twitter, Telegram)
  const category = (article.category || '').charAt(0).toUpperCase() + (article.category || '').slice(1);
  const hashtags = `#ImperioPublico #${category} #NoticiasRD #RepublicaDominicana`;
  const shortTitle = article.title.length > 200 ? article.title.slice(0, 197) + '...' : article.title;
  const tweetText = `${shortTitle}\n\n${articleUrl}\n\n${hashtags}`;

  console.log(`[Social] 📢 Auto-publicando: "${shortTitle.slice(0, 60)}..."`);

  // ── 1. TWITTER / X ────────────────────────────────────────────────────────
  // Requiere en Vercel: TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
  if (process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) {
    try {
      // OAuth 1.0a signature para Twitter v2
      const twitterRes = await postTweet(tweetText);
      if (twitterRes.ok) {
        console.log('[Social] ✅ Tweet publicado.');
      } else {
        const errBody = await twitterRes.text();
        console.warn('[Social] ⚠️ Twitter respondió:', errBody.slice(0, 200));
      }
    } catch (e) {
      console.error('[Social] Error en Twitter:', e.message);
    }
  }

  // ── 2. FACEBOOK PAGE ──────────────────────────────────────────────────────
  // Requiere en Vercel: FACEBOOK_PAGE_TOKEN, FACEBOOK_PAGE_ID
  if (process.env.FACEBOOK_PAGE_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    try {
      const fbMessage = `${shortTitle}\n\n${article.excerpt ? article.excerpt.slice(0, 300) : ''}\n\n🔗 Leer más: ${articleUrl}`;
      const fbRes = await fetch(
        `https://graph.facebook.com/v19.0/${process.env.FACEBOOK_PAGE_ID}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fbMessage,
            link: articleUrl,
            access_token: process.env.FACEBOOK_PAGE_TOKEN,
          }),
        }
      );
      const fbData = await fbRes.json();
      if (fbData.id) {
        console.log(`[Social] ✅ Facebook publicado: ${fbData.id}`);
      } else {
        console.warn('[Social] ⚠️ Facebook error:', JSON.stringify(fbData).slice(0, 200));
      }
    } catch (e) {
      console.error('[Social] Error en Facebook:', e.message);
    }
  }

  // ── 3. TELEGRAM ──────────────────────────────────────────────────────────
  // Requiere en Vercel: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
  // Canal recomendado: crear un Canal de Telegram de Imperio Público
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const telegramText = `<b>📰 ${shortTitle}</b>\n\n${article.excerpt ? article.excerpt.slice(0, 500) : ''}\n\n<a href="${articleUrl}">➡️ Leer noticia completa</a>\n\n<i>${hashtags}</i>`;
      const telegramRes = await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: telegramText,
            parse_mode: 'HTML',
            disable_web_page_preview: false,
          }),
        }
      );
      const tgData = await telegramRes.json();
      if (tgData.ok) {
        console.log('[Social] ✅ Telegram publicado.');
      } else {
        console.warn('[Social] ⚠️ Telegram error:', tgData.description);
      }
    } catch (e) {
      console.error('[Social] Error en Telegram:', e.message);
    }
  }
}

/**
 * Publica un tweet usando OAuth 1.0a (Twitter API v2)
 * No requiere librerías externas — implementación nativa con crypto.
 */
async function postTweet(text) {
  const { createHmac } = await import('crypto');

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

  // Construir base string para firma
  const paramStr = Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join('&');

  const baseStr = [
    method,
    encodeURIComponent(url),
    encodeURIComponent(paramStr),
  ].join('&');

  const signingKey = `${encodeURIComponent(process.env.TWITTER_API_SECRET)}&${encodeURIComponent(process.env.TWITTER_ACCESS_SECRET)}`;
  const signature = createHmac('sha1', signingKey).update(baseStr).digest('base64');

  const authHeader = 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: signature })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ');

  return fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
}
