const Parser = require('rss-parser');
const parser = new Parser({
  headers: { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
  }
});

const candidates = [
  'https://listindiario.com/rss/portada.xml',
  'https://listindiario.com/rss',
  'https://www.diariolibre.com/rss/portada.xml',
  'https://robertocavada.com/feed/',
  'https://remolacha.net/feed/',
  'https://almomento.net/feed/'
];

async function testFeeds() {
  for (const url of candidates) {
    try {
      console.log(`\nProbando ${url}...`);
      const feed = await parser.parseURL(url);
      console.log(`¡Éxito! Título: ${feed.title}, ítems: ${feed.items?.length}`);
      if (feed.items && feed.items.length > 0) {
        console.log(`- Primer artículo: ${feed.items[0].title}`);
      }
    } catch (e) {
      console.log(`Error en ${url}: ${e.message}`);
    }
  }
}

testFeeds();
