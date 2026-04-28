/**
 * lib/social.js — Infraestructura para compartición automática en RRSS
 */

/**
 * Publica un artículo en las redes sociales configuradas.
 * @param {Object} article - El objeto del artículo recién creado
 */
export async function postToSocialMedia(article) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://imperiopublico.com'}/articulo/${article.slug}`;
  const message = `🚨 ${article.title}\n\nLee más aquí: ${url}\n\n#ImperioPublico #NoticiasRD #RepublicaDominicana`;

  console.log(`[Social] Preparando publicación para: ${article.title}`);

  // 1. Twitter / X (Requiere API Key)
  if (process.env.TWITTER_API_KEY) {
     try {
       // Aquí iría la lógica de twitter-api-v2
       console.log('[Social] Notificando a Twitter...');
     } catch (e) {
       console.error('[Social] Error en Twitter:', e.message);
     }
  }

  // 2. Facebook (Requiere Page Access Token)
  if (process.env.FACEBOOK_PAGE_TOKEN) {
     try {
       // Aquí iría la lógica de FB Graph API
       console.log('[Social] Notificando a Facebook...');
     } catch (e) {
       console.error('[Social] Error en Facebook:', e.message);
     }
  }

  // 3. Telegram (Muy efectivo en RD)
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });
      console.log('[Social] Notificado a Telegram.');
    } catch (e) {
      console.error('[Social] Error en Telegram:', e.message);
    }
  }
}
