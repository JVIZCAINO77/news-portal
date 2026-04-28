import { google } from 'googleapis';

/**
 * Notifica a Google sobre una nueva URL o una actualización mediante la Indexing API.
 * Requiere un archivo 'google-indexing-key.json' en la raíz del proyecto.
 * @param {string} url - La URL completa del artículo
 * @param {string} type - 'URL_UPDATED' o 'URL_DELETED'
 */
export async function notifyGoogleIndexing(url, type = 'URL_UPDATED') {
  try {
    // Si no hay archivo de credenciales, ignoramos silenciosamente para no romper el flujo
    const KEY_PATH = './google-indexing-key.json';
    
    // Usamos dynamic import o fs para chequear si existe el archivo (en Vercel se maneja diferente)
    // Para simplificar, intentamos inicializar y si falla por falta de archivo, salimos.
    
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_PATH,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const client = await auth.getClient();
    const indexing = google.indexing({
      version: 'v3',
      auth: client,
    });

    const res = await indexing.urlNotifications.publish({
      requestBody: {
        url: url,
        type: type,
      },
    });

    console.log(`[Indexing API] Notificación enviada para: ${url}`, res.data);
    return res.data;
  } catch (error) {
    if (error.code === 'ENOENT' || error.message.includes('No such file')) {
      console.warn('[Indexing API] Archivo google-indexing-key.json no encontrado. Saltando notificación.');
    } else {
      console.error('[Indexing API] Error al notificar a Google:', error.message);
    }
    return null;
  }
}
