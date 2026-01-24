require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log("Checking available models...");
        // There isn't a direct "listModels" function in the helper, 
        // so we test the most common ones to see which one replies "OK".

        const modelsToTest = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.5-pro-latest",
            "gemini-pro",
            "gemini-pro-vision"
        ];

        for (const modelName of modelsToTest) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                // We send a tiny dummy prompt just to check connection
                await model.generateContent("Hello");
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