async function test() {
  const prompt = "Escribe un json: {\"title\": \"hola\", \"content\": \"mundo\"}";
  const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?json=true`;
  const res = await fetch(url);
  const text = await res.text();
  console.log("Res:", text);
}
test();
