const Parser = require('rss-parser');

const parser = new Parser({
  headers: { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
  }
});

const sources = [
  'https://acento.com.do/feed/?s=nacionales',
  'https://n.com.do/feed/?s=nacionales',
  'https://elnacional.com.do/feed/?s=nacionales',
  'https://elcaribe.com.do/feed/?s=nacionales',
  'https://hoy.com.do/feed/?s=nacionales'
];

async function testFeeds() {
  const todayDR = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santo_Domingo',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());

  console.log(`Hoy en RD es: ${todayDR}`);

  let pooledItems = [];
  for (const source of sources) {
    try {
      console.log(`Fetching ${source}...`);
      const feed = await parser.parseURL(source);
      if (feed.items) {
        pooledItems = [...pooledItems, ...feed.items];
      }
    } catch (e) {
      console.error(`Error en ${source}:`, e.message);
    }
  }

  console.log(`\nTotal de ítems obtenidos: ${pooledItems.length}`);
  
  if (pooledItems.length > 0) {
    console.log("Fechas de los primeros 5 ítems:");
    pooledItems.slice(0, 5).forEach(item => {
      console.log(`- ${item.title.substring(0,50)}... | pubDate: ${item.pubDate} | isoDate: ${item.isoDate}`);
    });
  }

  const todaysItems = pooledItems.filter(item => {
    const dateStr = item.isoDate || item.pubDate;
    if (!dateStr) return false;
    const itemDR = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santo_Domingo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date(dateStr));
    return itemDR === todayDR;
  });

  console.log(`\nÍtems que cumplen el filtro de "HOY en RD": ${todaysItems.length}`);
}

testFeeds();
