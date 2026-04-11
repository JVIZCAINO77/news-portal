const Parser = require('rss-parser');
const parser = new Parser();

async function testFetch() {
    const feedUrl = `https://deultimominuto.net/feed/?s=accidentes`;
    try {
        const feed = await parser.parseURL(feedUrl);
        console.log("Success! Items found:", feed.items.length);
        if(feed.items.length > 0)
            console.log("First:", feed.items[0].title);
    } catch(e) {
        console.log("Failed:", e.message);
    }
}
testFetch();
