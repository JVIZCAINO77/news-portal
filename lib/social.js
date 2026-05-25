/**
 * lib/social.js — Auto-publicación en RRSS cuando el bot publica un artículo.
 * ─────────────────────────────────────────────────────────────────────────────
 * Variables requeridas en Vercel > Settings > Environment Variables:
 *
 *  FACEBOOK PAGE:
 *    FACEBOOK_PAGE_TOKEN      → Page Access Token permanente (renovar cada 60 días)
 *    FACEBOOK_PAGE_ID         → ID interno: 1070862352777957
 *
 *  INSTAGRAM (Business conectada a la Página):
 *    INSTAGRAM_USER_ID        → ID Business: 17841437343937084
 *    FACEBOOK_PAGE_TOKEN      → Mismo token de Facebook
 *
 *  TWITTER / X (requiere créditos en console.x.com):
 *    TWITTER_API_KEY          → Consumer Key
 *    TWITTER_API_SECRET       → Consumer Secret
 *    TWITTER_ACCESS_TOKEN     → Access Token (Read & Write)
 *    TWITTER_ACCESS_SECRET    → Access Token Secret
 *
 *  TELEGRAM (opcional):
 *    TELEGRAM_BOT_TOKEN       → Token del bot (@BotFather)
 *    TELEGRAM_CHAT_ID         → ID del canal
 */

import { getFbPageToken } from './fbToken.js';

const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL    || 'https://imperiopublico.com';
const CLOUD_NAME    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dkkw77byz';

// ─── URL DE MINIATURA ESTILIZADA (/api/og) ──────────────────────────────────
/**
 * Devuelve la URL de la miniatura estilo Imperio Público generada en /api/og.
 * La imagen tiene: fondo granate, foto del artículo, título, categoría, logo IP.
 * @param {string} slug  Slug del artículo
 * @returns {string}     URL pública de la miniatura PNG 1080x1080
 */
function buildThumbnailUrl(slug) {
  return `${SITE_URL}/api/og?slug=${encodeURIComponent(slug)}`;
}

// ─── GENERAR THUMBNAIL BRANDED Y SUBIRLO A CLOUDINARY ────────────────────────
/**
 * Genera la miniatura estilizada del artículo, la sube a Cloudinary y devuelve
 * la URL estática. Esto permite que Instagram (Meta) acceda a la imagen sin
 * depender del endpoint dinámico de Next.js.
 *
 * @param {string} slug          Slug del artículo
 * @param {string} fallbackImage URL de imagen directa (fallback si falla)
 * @returns {Promise<string|null>} URL de Cloudinary o fallback
 */
async function generateBrandedThumbnail(slug, fallbackImage) {
  try {
    const ogUrl = buildThumbnailUrl(slug);
    console.log(`[Social] 🎨 Generando thumbnail branded para IG: ${ogUrl}`);

    // 1. Descargar la imagen generada por /api/og
    const ctrl    = new AbortController();
    const timer   = setTimeout(() => ctrl.abort(), 15000); // 15s timeout
    const ogRes   = await fetch(ogUrl, { signal: ctrl.signal });
    clearTimeout(timer);

    if (!ogRes.ok) throw new Error(`OG fetch failed: ${ogRes.status}`);

    const contentType = ogRes.headers.get('content-type') || 'image/png';
    const buffer      = await ogRes.arrayBuffer();
    const base64      = Buffer.from(buffer).toString('base64');
    const dataUri     = `data:${contentType};base64,${base64}`;

    // 2. Subir a Cloudinary (unsigned upload con preset)
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'news_portal';
    const formData     = new FormData();
    formData.append('file', dataUri);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'imperio-publico/thumbnails');
    formData.append('public_id', `thumb_${slug.slice(0, 60)}`);
    formData.append('overwrite', 'true');

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    const cloudData = await cloudRes.json();

    if (cloudData.secure_url) {
      console.log(`[Social] ✅ Thumbnail subido a Cloudinary: ${cloudData.secure_url.slice(0, 70)}`);
      return cloudData.secure_url;
    }
    throw new Error(`Cloudinary error: ${JSON.stringify(cloudData.error || cloudData)}`);

  } catch (e) {
    console.warn(`[Social] ⚠️ Thumbnail branded falló (${e.message}) — usando imagen directa.`);
    return fallbackImage || null;
  }
}



// ─── BUILDER DE HASHTAGS POR CATEGORÍA ───────────────────────────────────────
function buildHashtags(category) {
  const cat = (category || '').toLowerCase();
  const catTag = cat.charAt(0).toUpperCase() + cat.slice(1);

  const extraTags = {
    politica:       '#Politica #Gobierno #AbinaderRD',
    deportes:       '#Deportes #Beisbol #RD',
    economia:       '#Economia #Finanzas #DolarRD',
    sucesos:        '#Sucesos #PoliciaRD #Crimen',
    policia:        '#Policia #DICRIM #JusticiaRD',
    internacional:  '#Internacional #Mundo #Global',
    tecnologia:     '#Tecnologia #IA #Tech',
    entretenimiento:'#Farandula #Entretenimiento #Espectaculos',
    salud:          '#Salud #Bienestar #MedicinaRD',
    cultura:        '#Cultura #Arte #RD',
    tendencias:     '#Tendencias #Viral #RD',
  };

  return `#ImperioPublico #${catTag} #NoticiasRD #RepublicaDominicana ${extraTags[cat] || ''}`.trim();
}

// ─── MAIN: Publicar en todas las redes ───────────────────────────────────────
/**
 * Publica un artículo en todas las redes sociales configuradas.
 * @param {Object} article  El artículo recién insertado en BD
 */
export async function postToSocialMedia(article) {
  const articleUrl  = `${SITE_URL}/articulo/${article.slug}`;
  const hashtags    = buildHashtags(article.category);
  const shortTitle  = article.title.length > 230 ? article.title.slice(0, 227) + '…' : article.title;
  const excerpt     = (article.excerpt || '').slice(0, 280);

  // ── Token de Facebook — leer desde Supabase con auto-refresh ──────────────
  const FB_TOKEN = await getFbPageToken();
  if (!FB_TOKEN) {
    console.error('[Social] ❌ No hay Facebook Page Token disponible. Publicación cancelada.');
    return;
  }

  // URL de la miniatura estilizada (usada como OG meta tag en Facebook/Twitter)
  const thumbnailUrl = buildThumbnailUrl(article.slug);

  // Para Instagram: generamos el thumbnail branded y lo subimos a Cloudinary.
  // Meta no puede acceder a rutas dinámicas de Next.js, pero sí a Cloudinary.
  const fallbackImage = article.image?.split('?')[0] || null;
  const igImageUrl    = await generateBrandedThumbnail(article.slug, fallbackImage);

  console.log(`[Social] 📢 Auto-publicando: "${shortTitle.slice(0, 60)}"`);
  console.log(`[Social] 🔗 ${articleUrl}`);

  // ── 1. FACEBOOK PAGE ──────────────────────────────────────────────────────
  // FB genera automáticamente la previsualización del link (Open Graph).
  // Incluimos el mensaje completo + link clicable para máximo alcance.
  if (FB_TOKEN && process.env.FACEBOOK_PAGE_ID) {
    try {
      const fbMessage = [
        `📰 ${shortTitle}`,
        '',
        excerpt,
        '',
        `➡️ Leer la noticia completa:`,
        articleUrl,
        '',
        hashtags,
      ].join('\n');

      const fbRes = await fetch(
        `https://graph.facebook.com/v22.0/${process.env.FACEBOOK_PAGE_ID}/feed`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fbMessage,
            link: articleUrl,           // Genera la tarjeta de previsualización automática
            access_token: FB_TOKEN,
          }),
        }
      );
      const fbData = await fbRes.json();
      if (fbData.id) {
        console.log(`[Social] ✅ Facebook publicado: https://facebook.com/${fbData.id}`);
      } else {
        console.warn('[Social] ⚠️ Facebook error:', JSON.stringify(fbData).slice(0, 200));
      }
    } catch (e) {
      console.error('[Social] Error en Facebook:', e.message);
    }
  }

  // ── 2. INSTAGRAM BUSINESS (Graph API) ─────────────────────────────────────
  // IG requiere imagen. Usa URL limpia de Cloudinary.
  // El link en bio siempre apunta a imperiopublico.com.
  if (process.env.INSTAGRAM_USER_ID && FB_TOKEN && igImageUrl) {
    try {
      const igCaption = [
        `📰 ${shortTitle}`,
        '',
        excerpt,
        '',
        `🔗 Link en bio → imperiopublico.com`,
        '',
        hashtags,
      ].join('\n');

      console.log(`[Social] 📸 Instagram usando imagen: ${igImageUrl.slice(0, 80)}...`);

      // Paso 1: Crear contenedor de media
      const containerRes = await fetch(
        `https://graph.facebook.com/v22.0/${process.env.INSTAGRAM_USER_ID}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: igImageUrl,
            caption: igCaption,
            access_token: FB_TOKEN,
          }),
        }
      );
      const containerData = await containerRes.json();

      if (!containerData.id) {
        console.warn('[Social] ⚠️ Instagram container error:', JSON.stringify(containerData));
      } else {
        console.log(`[Social] 🔄 Instagram container creado: ${containerData.id} — esperando procesamiento...`);

        // Paso 1.5: Polling de estado hasta FINISHED (máx 6 intentos × 3s = 18s)
        let status = 'IN_PROGRESS';
        for (let attempt = 0; attempt < 6 && status !== 'FINISHED'; attempt++) {
          await new Promise(r => setTimeout(r, 3000));
          try {
            const statusRes = await fetch(
              `https://graph.facebook.com/v22.0/${containerData.id}?fields=status_code&access_token=${FB_TOKEN}`
            );
            const statusData = await statusRes.json();
            status = statusData.status_code || 'UNKNOWN';
            console.log(`[Social] 🔄 Instagram container status (intento ${attempt + 1}): ${status}`);
            if (status === 'ERROR') {
              console.warn('[Social] ⚠️ Instagram container en estado ERROR — abortando publicación.');
              break;
            }
          } catch (_) { /* continuar */ }
        }

        if (status === 'FINISHED') {
          // Paso 2: Publicar
          const publishRes = await fetch(
            `https://graph.facebook.com/v22.0/${process.env.INSTAGRAM_USER_ID}/media_publish`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                creation_id: containerData.id,
                access_token: FB_TOKEN,
              }),
            }
          );
          const publishData = await publishRes.json();
          if (publishData.id) {
            console.log(`[Social] ✅ Instagram publicado: ${publishData.id}`);
          } else {
            console.warn('[Social] ⚠️ Instagram publish error:', JSON.stringify(publishData));
          }
        } else {
          console.warn(`[Social] ⚠️ Instagram container no llegó a FINISHED (último estado: ${status}). Publicación omitida.`);
        }
      }
    } catch (e) {
      console.error('[Social] Error en Instagram:', e.message);
    }
  }


  // ── 3. TWITTER / X ────────────────────────────────────────────────────────
  // Máx 280 chars. Incluimos título + link (el link ocupa ~23 chars de Twitter).
  if (process.env.TWITTER_API_KEY && process.env.TWITTER_ACCESS_TOKEN) {
    try {
      // Twitter acorta URLs a ~23 chars automáticamente
      const maxTitleLen = 280 - 23 - hashtags.length - 10; // 10 de saltos de línea
      const twitterTitle = shortTitle.length > maxTitleLen
        ? shortTitle.slice(0, maxTitleLen - 1) + '…'
        : shortTitle;

      const tweetText = [
        `📰 ${twitterTitle}`,
        '',
        articleUrl,
        '',
        hashtags,
      ].join('\n');

      const twitterRes = await postTweet(tweetText);
      const twitterData = await twitterRes.json();
      if (twitterData.data?.id) {
        console.log(`[Social] ✅ Tweet publicado: https://x.com/Imperiopublico/status/${twitterData.data.id}`);
      } else {
        console.warn('[Social] ⚠️ Twitter error:', JSON.stringify(twitterData).slice(0, 200));
      }
    } catch (e) {
      console.error('[Social] Error en Twitter:', e.message);
    }
  }

  // ── 4. TELEGRAM ───────────────────────────────────────────────────────────
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const telegramText = [
        `<b>📰 ${shortTitle}</b>`,
        '',
        excerpt,
        '',
        `<a href="${articleUrl}">➡️ Leer noticia completa</a>`,
        '',
        `<i>${hashtags}</i>`,
      ].join('\n');

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

// ─── TWITTER OAuth 1.0a (sin librerías externas) ─────────────────────────────
async function postTweet(text) {
  const { createHmac } = await import('crypto');

  const method    = 'POST';
  const url       = 'https://api.twitter.com/2/tweets';
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce     = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

  const oauthParams = {
    oauth_consumer_key:     process.env.TWITTER_API_KEY,
    oauth_nonce:            nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        timestamp,
    oauth_token:            process.env.TWITTER_ACCESS_TOKEN,
    oauth_version:          '1.0',
  };

  const paramStr   = Object.keys(oauthParams).sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`).join('&');
  const baseStr    = [method, encodeURIComponent(url), encodeURIComponent(paramStr)].join('&');
  const signingKey = `${encodeURIComponent(process.env.TWITTER_API_SECRET)}&${encodeURIComponent(process.env.TWITTER_ACCESS_SECRET)}`;
  const signature  = createHmac('sha1', signingKey).update(baseStr).digest('base64');

  const authHeader = 'OAuth ' + Object.entries({ ...oauthParams, oauth_signature: signature })
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(', ');

  return fetch(url, {
    method,
    headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}
