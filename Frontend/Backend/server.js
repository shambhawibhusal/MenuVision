require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// Increase limit to allow sending large photos (50mb)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Check API Key
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing in .env file!");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/analyze-menu', async (req, res) => {
    try {
        console.log("------------------------------------------------");
        console.log("1. Received image. Processing...");

        const { image } = req.body;

        if (!image) {
            return res.status(400).json({ success: false, error: "No image provided" });
        }

        // Clean the base64 string
        const base64Data = image.split(',')[1];

        // --- UPDATED MODEL TO 'LITE' VERSION ---
        // This consumes less quota and avoids 429 errors
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite-preview-02-05" });

        const prompt = `
            Analyze this menu image. Extract dish names and prices.
            For each dish, estimate calories and list 3 main ingredients based on general food knowledge.
            
            IMPORTANT: Return ONLY a raw JSON array. 
            Do not write "json" or "\`\`\`" or "Here is the list". 
            Just start with [ and end with ].

            Output format:
            [
                {
                    "name": "Dish Name",
                    "price": "Price",
                    "description": "Short description",
                    "ingredients": "Ingredient 1, Ingredient 2, Ingredient 3",
                    "calories": "450 kcal",
                    "type": "Veg" (or Non-Veg)
                }
            ]
        `;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: "image/png",
            },
        };

        console.log("2. Sending to Gemini 2.0 Flash Lite...");
        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();

        console.log("3. AI Response Received.");

        // --- ROBUST JSON PARSING ---
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');

        if (firstBracket === -1 || lastBracket === -1) {
            throw new Error("AI did not return a valid JSON array.");
        }

        const jsonString = text.substring(firstBracket, lastBracket + 1);
        const menuItems = JSON.parse(jsonString);

        console.log(`4. Success! Found ${menuItems.length} items.`);
        res.json({ success: true, data: menuItems });

    } catch (error) {
        console.error("!!! SERVER ERROR !!!");
        console.error(error);

        // Handle Rate Limit specifically to tell frontend what happened
        if (error.message.includes("429")) {
            res.status(429).json({ success: false, error: "Too many requests. Please wait 1 minute and try again." });
        } else {
            res.status(500).json({ success: false, error: error.message });
        }
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend Server running on http://localhost:${PORT}`));