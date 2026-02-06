// server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");

const {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} = require("@google/genai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = "gemini-2.5-flash-lite";

function parseBase64Image(input) {
    // Accept either data URL: "data:image/png;base64,...." OR raw base64
    if (!input) throw new Error("No image provided");

    const isDataUrl = input.startsWith("data:");
    const mimeType = isDataUrl
        ? input.split(";")[0].split(":")[1] || "image/png"
        : "image/png";

    const base64 = isDataUrl ? input.split(",")[1] : input;
    if (!base64) throw new Error("Invalid base64 image");

    return { mimeType, base64 };
}

function extractJsonObject(text) {
    // Robust “find the outermost JSON object” approach
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error("AI response did not contain a JSON object");
    }
    return JSON.parse(text.slice(start, end + 1));
}

app.post("/analyzeMenu", async (req, res) => {
    let tempFilePath;

    try {
        const imageInput = req.body.imageUrl || req.body.imageBase64;
        const { mimeType, base64 } = parseBase64Image(imageInput);

        const buffer = Buffer.from(base64, "base64");
        const ext = (mimeType.split("/")[1] || "png").replace(/[^a-z0-9]/gi, "");
        tempFilePath = path.join(os.tmpdir(), `menu_${Date.now()}.${ext}`);

        await fs.writeFile(tempFilePath, buffer);

        // Upload file (mimeType is set via `config`) [web:2]
        const uploaded = await ai.files.upload({
            file: tempFilePath,
            config: { mimeType },
        });

        if (!uploaded?.uri || !uploaded?.mimeType) {
            throw new Error("Upload succeeded but returned no uri/mimeType");
        }

        const promptText = [
            "Act as an OCR menu scanner.",
            'Return ONLY valid JSON: { "fullText": string, "menuItems": array }.',
            'Each menu item: { "name": string, "price": string|null, "description": string|null }.',
            "Extract every visible menu item; do not include markdown fences.",
        ].join("\n");

        const response = await ai.models.generateContent({
            model: modelName,
            contents: createUserContent([
                promptText,
                createPartFromUri(uploaded.uri, uploaded.mimeType),
            ]),
        });

        const text = response.text || "";
        const data = extractJsonObject(text);

        res.json({
            success: true,
            fullText: data.fullText ?? "",
            menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
        });
    } catch (err) {
        const message = err?.message || "Unknown error";
        const status =
            message.includes("429") ? 429 : message.includes("404") ? 404 : 500;

        res.status(status).json({
            success: false,
            error:
                status === 429
                    ? "AI Quota reached. Please wait and try again."
                    : message,
        });
    } finally {
        if (tempFilePath) {
            try {
                await fs.unlink(tempFilePath);
            } catch (_) { }
        }
    }
});

app.listen(5000, () => {
    console.log("✅ Backend running on http://localhost:5000");
});