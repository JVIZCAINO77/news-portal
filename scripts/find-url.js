const fs = require('fs');
const html = fs.readFileSync('scripts/dump.html', 'utf8');
const urls = html.match(/https?:\/\/[^\s"'<>]+/g);
if (urls) {
    const found = urls.filter(u => u.includes('desenredando') || u.includes('deultimo') || u.includes('latam') || u.includes('diario'));
    console.log("Found real urls:", found.slice(0, 10));
} else {
    console.log("No URLs found at all");
}
