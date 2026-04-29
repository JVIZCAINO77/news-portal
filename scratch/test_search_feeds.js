const Parser = require('rss-parser');
const parser = new Parser();

const candidates = [
  'https://robertocavada.com/feed/?s=politica',
  'https://remolacha.net/feed/?s=nacionales',
  'https://almomento.net/feed/?s=economia'
];

async function testFeeds() {
  for (const url of candidates) {
    try {
      console.log(`\nProbando ${url}...`);
      const feed = await parser.parseURL(url);
      console.log(`¡Éxito! Título: ${feed.title}, ítems: ${feed.items?.length}`);
    } catch (e) {
      console.log(`Error en ${url}: ${e.message}`);
    }
  }
}

testFeeds();
