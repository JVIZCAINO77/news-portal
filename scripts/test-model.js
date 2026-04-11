const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Utilizo apiKey de env

async function listCustom() {
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: "hola"
      });
      console.log('gemini-2.0-flash-lite is supported', response.text.substring(0, 10));
  } catch(e) {
      console.log("Error gemini-2.0-flash-lite:", e.message);
  }
}

listCustom();
