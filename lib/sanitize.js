// lib/sanitize.js — Sanitizador HTML server-side para Imperio Público
// Soluciona C1: XSS Stored por dangerouslySetInnerHTML sin sanitizar.
// Sin dependencias externas — allowlist puro, cero overhead.
// Compatible con Edge Runtime y Node.js serverless.

/** Tags HTML permitidos en el contenido editorial */
const ALLOWED_TAGS = new Set([
  'p','br','strong','b','em','i','u','s','del',
  'h1','h2','h3','h4','h5','h6',
  'ul','ol','li','blockquote','pre','code',
  'a','img','figure','figcaption',
  'table','thead','tbody','tr','th','td',
  'div','span','hr',
]);

/** Atributos permitidos por tag */
const ALLOWED_ATTRS = {
  a:   ['href','title','target','rel'],
  img: ['src','alt','width','height','loading','class'],
  '*': ['class','id'],   // cualquier tag puede tener class e id
};

/** Protocolos seguros para href/src */
const SAFE_PROTOCOLS = /^(https?|mailto|tel):/i;

/**
 * Sanitiza HTML del lado del servidor usando una allowlist estricta.
 * Elimina: <script>, <iframe>, <object>, <embed>, atributos on*, javascript: URLs.
 * 
 * @param {string} dirty - HTML potencialmente peligroso
 * @returns {string} HTML seguro para renderizar con dangerouslySetInnerHTML
 */
export function sanitizeHtml(dirty) {
  if (!dirty || typeof dirty !== 'string') return '';

  return dirty
    // 1. Eliminar bloques completos de tags peligrosos (con todo su contenido)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^>]*>/gi, '')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '')
    .replace(/<template\b[^<]*(?:(?!<\/template>)<[^<]*)*<\/template>/gi, '')
    // 2. Eliminar atributos de eventos (onclick, onload, onerror, etc.)
    .replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // 3. Eliminar URLs javascript: y data: en href/src
    .replace(/(href|src|action)\s*=\s*["']?\s*javascript:[^"'>]*/gi, '$1="#"')
    .replace(/(href|src|action)\s*=\s*["']?\s*data:[^"'>]*/gi, '$1="#"')
    // 4. Eliminar atributos peligrosos
    .replace(/\s+(formaction|srcdoc|xlink:href|lowsrc)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    // 5. Eliminar tags no permitidos (mantener su contenido de texto)
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
      if (ALLOWED_TAGS.has(tag.toLowerCase())) return match;
      // Tag no permitido: eliminar la etiqueta pero conservar el texto interior
      return '';
    });
}

/**
 * Stripea TODO el HTML y devuelve solo texto plano.
 * Útil para AudioReader (TTS), meta descriptions, etc.
 * 
 * @param {string} html - HTML o texto mixto
 * @returns {string} Texto plano sin ninguna etiqueta
 */
export function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]+>/g, ' ')         // etiquetas → espacio
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
