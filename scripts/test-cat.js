const Parser = require('rss-parser');
const parser = new Parser();

async function testFetch() {
    const feedUrl = `https://deultimominuto.net/category/deportes/feed/`;
    try {
        const feed = await parser.parseURL(feedUrl);
        console.log("Success! Items found:", feed.items.length);
        console.log("First:", feed.items[0].title);
    } catch(e) {
        console.log("Failed:", e.message);
    }
}
testFetch();
