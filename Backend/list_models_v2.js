require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listAllModels() {
    try {
        console.log("Fetching available models...");
        // Use the native listModels function
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("\nAvailable Model Names:");
            data.models.forEach(m => {
                console.log(m.name.replace("models/", ""));
            });
        } else {
            console.log("No models found or error in response:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listAllModels();
