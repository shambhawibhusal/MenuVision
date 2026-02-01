require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

// Access your API key as an environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
    try {
        console.log("Checking available models using @google/genai...");

        const modelsToTest = [
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
        ];

        for (const modelName of modelsToTest) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                // We send a tiny dummy prompt just to check connection
                await ai.models.generateContent({
                    model: modelName,
                    contents: "Hello"
                });
                console.log("✅ AVAILABLE");
            } catch (error) {
                if (error.message.includes("404")) {
                    console.log("❌ NOT FOUND");
                } else {
                    console.log(`⚠️ Error (but found): ${error.message.split(' ')[0]}`);
                }
            }
        }

    } catch (error) {
        console.error("Critical Error:", error);
    }
}

listModels();
