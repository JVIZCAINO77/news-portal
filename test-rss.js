const Parser = require('rss-parser');
const parser = new Parser();
const query = 'Republica Dominicana noticias (site:listindiario.com OR site:diariolibre.com OR site:eldia.com.do OR site:elnacional.com.do OR site:somospueblo.com)';
const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=DO&ceid=DO:es-419`;

(async () => {
  try {
    const feed = await parser.parseURL(url);
    console.log('Resultados encontrados:', feed.items.length);
    console.log('Primer titular:', feed.items[0]?.title);
    console.log('Enlace:', feed.items[0]?.link);
  } catch(e) {
    console.error('Error:', e.message);
  }
})();
