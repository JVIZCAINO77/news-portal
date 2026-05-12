async function runBot() {
  console.log("Triggering bot for 'noticias' in production...");
  const url = `https://www.imperiopublico.com/api/cron/bot?category=noticias`;
  try {
    const res = await fetch(url, { headers: { 'X-Manual-Trigger': 'true' } });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
runBot();
