import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import os from "os";

import {
    GoogleGenAI,
    Part,
} from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not defined in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const modelName = "gemini-2.5-flash-lite";

interface ParsedImage {
    mimeType: string;
    base64: string;
}

function parseBase64Image(input: string): ParsedImage {
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

interface MenuData {
    fullText: string;
    menuItems: MenuItem[];
}

interface MenuItem {
    name: string;
    price: string | null;
    description: string | null;
}

function extractJsonObject(text: string): MenuData {
    // Robust “find the outermost JSON object” approach
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) {
        throw new Error("AI response did not contain a JSON object");
    }
    return JSON.parse(text.slice(start, end + 1));
}

interface AnalyzeMenuRequestBody {
    imageUrl?: string;
    imageBase64?: string;
}

app.post("/analyzeMenu", async (req: Request<{}, {}, AnalyzeMenuRequestBody>, res: Response) => {
    let tempFilePath: string | undefined;

    try {
        const imageInput = req.body.imageUrl || req.body.imageBase64;
        if (!imageInput) {
            throw new Error("No image data provided");
        }
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
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: promptText },
                        { fileData: { fileUri: uploaded.uri, mimeType: uploaded.mimeType } }
                    ]
                }
            ],
        });

        const text = (typeof (response as any).text === "function" ? (response as any).text() : (response as any).text) || "";
        const data = extractJsonObject(text);

        res.json({
            success: true,
            fullText: data.fullText ?? "",
            menuItems: Array.isArray(data.menuItems) ? data.menuItems : [],
        });
    } catch (err: any) {
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

interface ChatRequestBody {
    message: string;
}

app.post("/chat", async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
    try {
        const { message } = req.body;
        if (!message) throw new Error("Message is required");

        const prompt = `
        You are a helpful food expert AI. 
        User asked: "${message}"
        
        If the user asks about a specific food item, provide:
        1. A brief description of the food.
        2. Its origin/history.
        3. Approximate calories (if applicable).
        
        Keep the response concise and friendly.
        If the user's message is not related to food, politely steer them back to food topics.
        `;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ]
        });

        const text = (typeof (response as any).text === "function" ? (response as any).text() : (response as any).text) || "I couldn't generate a response.";
        res.json({ success: true, reply: text });

    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ success: false, error: "Failed to get AI response" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});