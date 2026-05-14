const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function testAI() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const models = ['gemini-3.1-flash-lite', 'gemini-3-flash-preview', 'gemini-flash-latest'];
  
  const prompt = `Escribe un titular breve sobre tecnología.`;

  for (const key of keys) {
    let success = false;
    for (const model of models) {
      if (success) break;
      console.log(`Intentando ${model} con clave ...${key.slice(-4)}`);
      const ai = new GoogleGenAI({ apiKey: key });
      try {
        const aiResponse = await ai.models.generateContent({
          model,
          contents: prompt,
        });
        console.log(`✅ Éxito (...${key.slice(-4)}): ${aiResponse.text.slice(0, 50)}...`);
        success = true;
      } catch (e) {
        console.error(`❌ Falló (...${key.slice(-4)}):`, e.message.slice(0, 50));
      }
    }
  }
}

testAI();
