const Parser = require('rss-parser');
const parser = new Parser();
const sources = [
  'https://cnnespanol.cnn.com/feed/',
  'https://www.france24.com/es/rss'
];

async function testFeeds() {
  let count = 0;
  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source);
      for (const item of feed.items) {
        if (item.isoDate && item.isoDate.startsWith('2026-04-28')) {
          count++;
        }
      }
    } catch (e) {}
  }
  console.log(`Noticias internacionales de hoy: ${count}`);
}
testFeeds();
