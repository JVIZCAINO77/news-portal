const Parser = require('rss-parser');
const parser = new Parser();

const sources = [
  'https://acento.com.do/feed/?s=',
  'https://n.com.do/feed/?s=',
  'https://elnacional.com.do/feed/?s=',
  'https://elcaribe.com.do/feed/?s=',
  'https://hoy.com.do/feed/?s=',
  'https://eldia.com.do/feed/?s=',
  'https://cdn.com.do/feed/?s=',
  'https://noticiassin.com/feed/?s=',
  'https://desenredandodr.com/feed/?s=',
  'https://deultimominuto.net/feed/?s='
];

async function checkZ101() {
  for (const source of sources) {
    try {
      const feed = await parser.parseURL(source);
      if (feed.items) {
        for (const item of feed.items) {
          if (item.link && item.link.includes('z101digital.com')) {
            console.log(`Found z101digital link in feed ${source}: ${item.link}`);
          }
        }
      }
    } catch (e) {
      console.log(`Error reading ${source}`);
    }
  }
}

checkZ101();
