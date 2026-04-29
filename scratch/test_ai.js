const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testAI() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const selectedKey = keys[0];
  const ai = new GoogleGenAI({ apiKey: selectedKey });

  const prompt = `PASO 3 — FORMATO DE RESPUESTA:
Tu respuesta debe ser EXCLUSIVAMENTE un objeto JSON válido. Sin bloques de código, sin texto adicional antes ni después.
Esquema obligatorio:
{ "title": "<titular_generado>", "excerpt": "<excerpt_generado>", "content": "<contenido_generado>", "tags": ["tag1", "tag2"] }`;

  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    console.log("Response:", aiResponse.text);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

testAI();
