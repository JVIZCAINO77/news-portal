const Parser = require('rss-parser');
const parser = new Parser();

async function testFetch() {
    const feedUrl = `https://news.google.com/rss/search?q=Republica+dominicana+noticias&hl=es-419&gl=US&ceid=US:es-419`;
    const feed = await parser.parseURL(feedUrl);
    const first = feed.items[0];
    console.log("Title:", first.title);
    console.log("Content:", first.content);
    console.log("Snippet:", first.contentSnippet);
    console.log("Source:", first.source);
}
testFetch();
