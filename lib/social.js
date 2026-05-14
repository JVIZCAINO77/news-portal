/**
 * lib/social.js — Auto-publicación en RRSS cuando el bot publica un artículo.
 * ─────────────────────────────────────────────────────────────────────────────
 * Activa añadiendo estas variables en Vercel > Settings > Environment Variables:
 *
 *  TWITTER / X:
 *    TWITTER_API_KEY          → "API Key" de tu app en developer.twitter.com
 *    TWITTER_API_SECRET       → "API Key Secret"
 *    TWITTER_ACCESS_TOKEN     → "Access Token" (con permisos de escritura)
 *    TWITTER_ACCESS_SECRET    → "Access Token Secret"
 *
 *  FACEBOOK PAGE:
 *    FACEBOOK_PAGE_TOKEN      → Page Access Token (de Graph API Explorer)
 *    FACEBOOK_PAGE_ID         → ID numérico de tu Página de Facebook
 *
 *  INSTAGRAM (necesita cuenta Business conectada a tu Página de Facebook):
 *    INSTAGRAM_USER_ID        → ID numérico de la cuenta IG Business
 *    FACEBOOK_PAGE_TOKEN      → El mismo token de Facebook (tiene acceso a IG)
 *
 *  TELEGRAM (el más fácil - crea un bot con @BotFather en 2 minutos):
 *    TELEGRAM_BOT_TOKEN       → Token del bot (ej: 123456:ABC-DEF...)
 *    TELEGRAM_CHAT_ID         → ID del canal (ej: @imperiopublico o -100123456)
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://imperiopublico.com';

/**
 * Publica un artículo en todas las redes sociales configuradas.
 * @param {Object} article - El objeto del artículo recién insertado en BD
 */
export async function postToSocialMedia(article) {
  const articleUrl = `${SITE_URL}/articulo/${article.slug}`;

  const category = (article.category || '').charAt(0).toUpperCase() + (article.category || '').slice(1);
  const hashtags = `#ImperioPublico #${category} #NoticiasRD #RepublicaDominicana`;
  const shortTitle = article.title.length > 220 ? article.title.slice(0, 217) + '...' : article.title;
  const tweetText = `${shortTitle}\n\n${articleUrl}\n\n${hashtags}`;

  console.log(`[Social] 📢 Auto-publicando: "${shortTitle.slice(0, 60)}..."`);

  // ── 1. TWITTER / X ────────────────────────────────────────────────────────
  if (process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) {
    try {
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
  if (process.env.FACEBOOK_PAGE_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    try {
      const fbMessage = `${shortTitle}\n\n${article.excerpt ? article.excerpt.slice(0, 300) : ''}\n\n🔗 Leer más: ${articleUrl}\n\n${hashtags}`;
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

  // ── 3. INSTAGRAM BUSINESS (Graph API) ─────────────────────────────────────
  // Instagram requiere una imagen para publicar. Usamos la imagen del artículo.
  // La cuenta debe ser Business/Creator y estar conectada a la Página de Facebook.
  if (process.env.INSTAGRAM_USER_ID && process.env.FACEBOOK_PAGE_TOKEN && article.image) {
    try {
      const igCaption = `${shortTitle}\n\n${article.excerpt ? article.excerpt.slice(0, 400) : ''}\n\n🔗 Link en bio | imperiopublico.com\n\n${hashtags}`;

      // Paso 1: Crear el contenedor de media
      const containerRes = await fetch(
        `https://graph.facebook.com/v19.0/${process.env.INSTAGRAM_USER_ID}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: article.image,  // Debe ser una URL pública accesible
            caption: igCaption,
            access_token: process.env.FACEBOOK_PAGE_TOKEN,
          }),
        }
      );
      const containerData = await containerRes.json();

      if (containerData.id) {
        // Paso 2: Publicar el contenedor
        const publishRes = await fetch(
          `https://graph.facebook.com/v19.0/${process.env.INSTAGRAM_USER_ID}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: containerData.id,
              access_token: process.env.FACEBOOK_PAGE_TOKEN,
            }),
          }
        );
        const publishData = await publishRes.json();
        if (publishData.id) {
          console.log(`[Social] ✅ Instagram publicado: ${publishData.id}`);
        } else {
          console.warn('[Social] ⚠️ Instagram publish error:', JSON.stringify(publishData).slice(0, 200));
        }
      } else {
        console.warn('[Social] ⚠️ Instagram container error:', JSON.stringify(containerData).slice(0, 200));
      }
    } catch (e) {
      console.error('[Social] Error en Instagram:', e.message);
    }
  }

  // ── 4. TELEGRAM ──────────────────────────────────────────────────────────
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
 * Publica un tweet usando OAuth 1.0a (Twitter API v2) — sin librerías externas.
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

  const paramStr = Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join('&');

  const baseStr = [method, encodeURIComponent(url), encodeURIComponent(paramStr)].join('&');
  const signingKey = `${encodeURIComponent(process.env.TWITTER_API_SECRET)}&${encodeURIComponent(process.env.TWITTER_ACCESS_SECRET)}`;
  const signature = createHmac('sha1', signingKey).update(baseStr).digest('base64');

  const authHeader = 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: signature })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`)
    .join(', ');

  return fetch(url, {
    method,
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}
