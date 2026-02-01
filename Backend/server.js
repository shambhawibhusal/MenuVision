const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

admin.initializeApp();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Use gemini-2.0-flash-lite (confirmed available)
const modelName = "gemini-2.0-flash-lite";

app.post('/analyzeMenu', async (req, res) => {
    try {
        const { imageUrl, userId } = req.body;
        if (!imageUrl) return res.status(400).json({ error: "No image provided" });

        // 1. Prepare Base64
        const base64Data = imageUrl.split(",")[1] || imageUrl;
        const mimeType = imageUrl.split(";")[0].split(":")[1] || "image/png";

        const imagePart = {
            inlineData: { data: base64Data, mimeType },
        };

        // 2. Prompt (Forces JSON)
        const prompt = `Act as an OCR menu scanner. 
        1. Extract EVERY SINGLE WORD from the image as "fullText".
        2. Extract menu items into a structured array called "menuItems".
        
        Return ONLY a valid JSON object. 
        Example format:
        {
          "fullText": "Full text of the menu here...",
          "menuItems": [{"name": "Coffee", "price": "$5", "description": "Black coffee", "ingredients": "Coffee beans", "calories": "5 kcal"}]
        }
        
        Do not include markdown code blocks or any other text.`;

        console.log("Requesting Gemini API...");
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [prompt, imagePart]
        });

        let text = response.text;

        console.log("Raw AI Response:", text);

        // 3. Robust JSON Extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error("AI response did not contain a valid JSON object");
        }

        const data = JSON.parse(jsonMatch[0]);
        const menuItems = data.menuItems || [];
        const fullText = data.fullText || text;

        // 4. Save to Firestore
        const scanRef = admin.firestore().collection('menuScans').doc();
        await scanRef.set({
            userId: userId || "anonymous",
            menuItems,
            fullText,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.json({ success: true, menuItems, fullText });

    } catch (error) {
        console.error("DETAILED ERROR:", error);

        // Handle Quota Limit (429) specifically
        if (error.message && error.message.includes("429")) {
            return res.status(429).json({
                success: false,
                error: "AI Quota reached. Please wait 60 seconds and try again.",
                isQuotaError: true
            });
        }

        // Handle Model Not Found (404)
        if (error.message && error.message.includes("404")) {
            return res.status(404).json({
                success: false,
                error: "Model not found. Switched back to 2.0-flash-lite. Please restart server if error persists."
            });
        }

        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(5000, () => console.log("✅ Gemini Backend running on http://localhost:5000"));