const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 5000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  }
});

const feeds = [
  'https://www.diariolibre.com/rss/portada.xml',
  'https://acento.com.do/feed/?s=nacional',
  'https://almomento.net/feed/',
  'https://noticiassin.com/feed/?s=nacional',
  'https://elnacional.com.do/feed/?s=',
  'https://hoy.com.do/feed/?s=noticias',
];

async function testFeeds() {
  const feedPromises = feeds.map(async (feedUrl) => {
    try {
      const feed = await parser.parseURL(feedUrl);
      return feed.items || [];
    } catch (e) {
      console.warn(`[Bot] Feed falló (${feedUrl.slice(0, 50)}): ${e.message}`);
      return [];
    }
  });

  const results = await Promise.all(feedPromises);
  const pooledItems = results.flat();
  console.log(`Total items fetched: ${pooledItems.length}`);

  const todayDR = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());

  const todaysItems = pooledItems.filter(item => {
    const dateStr = item.isoDate || item.pubDate;
    if (!dateStr) return false;
    const itemDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date(dateStr));
    return itemDR === todayDR;
  });

  console.log(`Total items for today (${todayDR}): ${todaysItems.length}`);
  
  if (todaysItems.length > 0) {
      console.log('Sample of today\'s items:');
      todaysItems.slice(0, 5).forEach(i => console.log(`- ${i.title}`));
  }
}

testFeeds();
