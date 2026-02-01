require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listAllModels() {
    try {
        console.log("Fetching available models using @google/genai...");
        const response = await ai.models.list();

        if (response && response.length > 0) {
            console.log("\nAvailable Model Names:");
            response.forEach(m => {
                console.log(m.name.replace("models/", ""));
            });
        } else {
            console.log("No models found.");
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listAllModels();

