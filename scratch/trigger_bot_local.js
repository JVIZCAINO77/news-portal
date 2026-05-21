async function testLocalBot() {
  const missing = ['politica', 'deportes', 'cultura', 'tendencias', 'tecnologia', 'internacional', 'nacional'];
  console.log("Triggering bot locally for missing categories...");
  for (const cat of missing) {
    console.log(`\n============================`);
    console.log(`Triggering category: ${cat}`);
    const url = `http://localhost:3000/api/cron/bot?category=${cat}`;
    try {
      const res = await fetch(url, { headers: { 'X-Manual-Trigger': 'true' } });
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Local fetch failed for ${cat}:`, err.message);
    }
  }
}
testLocalBot();
