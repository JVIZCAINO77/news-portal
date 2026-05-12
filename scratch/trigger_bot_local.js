async function testLocalBot() {
  console.log("Triggering bot locally...");
  const url = `http://localhost:3000/api/cron/bot?category=noticias`;
  try {
    const res = await fetch(url, { headers: { 'X-Manual-Trigger': 'true' } });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Local fetch failed:", err.message);
  }
}
testLocalBot();
