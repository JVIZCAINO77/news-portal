const Parser = require('rss-parser');
const parser = new Parser();

async function checkFeeds() {
    const sites = [
        'https://desenredandodr.com/feed',
        'https://deultimominuto.net/feed',
        'https://noticiaslatam.lat/feed'
    ];
    for(const s of sites) {
        try {
            const feed = await parser.parseURL(s);
            console.log("Success on", s, "Items:", feed.items.length);
            const first = feed.items[0];
            console.log("First item link:", first.link);
            
            // Buscar URL de imagen en <description> o <content:encoded>
            const content = first['content:encoded'] || first.content || first.description || '';
            const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
            console.log("Image found in content:", imgMatch ? imgMatch[1] : null);
        } catch(e) {
            console.log("Failed on", s, e.message);
        }
    }
}
checkFeeds();
