const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

async function listModels() {
  const keys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
  const key = keys[0];
  console.log("Using key:", key.slice(0, 10) + "...");
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if (data.error) {
      console.error("Error listing models:", data.error);
      return;
    }
    console.log("Available models:");
    data.models.forEach(m => {
      console.log(`- ${m.name} (${m.displayName})`);
    });
  } catch (e) {
    console.error("Fetch error:", e.message);
  }
}

listModels();
