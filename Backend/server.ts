import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import os from "os";

import { google } from "@ai-sdk/google";
import { generateObject, streamText, generateText } from "ai";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const model = google("gemini-2.5-flash-lite");

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

function formatPrepTime(minutes: number | null): string | null {
    if (minutes === null || minutes === undefined || minutes <= 0) {
        return null;
    }
    if (minutes < 60) {
        return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours}hour`;
    }
    return `${hours}hour ${mins}min`;
}

const FoodItemSchema = z.object({
    name: z.string(),
    description: z.string().nullable(),
    price: z.string().nullable(),
    category: z.string().nullable(),
    ingredients: z.array(z.string()),
    allergens: z.array(z.string()),
    calories: z.number().nullable(),
    preparationTime: z.number().nullable(),
    origin: z.string().nullable(),
    isVegan: z.boolean().nullable(),
    isVegetarian: z.boolean().nullable(),
    isGlutenFree: z.boolean().nullable(),
    imageUrl: z.string().nullable().optional(),
});

const MenuSchema = z.object({
    fullText: z.string(),
    menuItems: z.array(FoodItemSchema)
});

interface AnalyzeMenuRequestBody {
    imageUrl?: string;
    imageBase64?: string;
}

async function fetchPixabayImage(dishName: string): Promise<string | null> {
    const pixabayKey = process.env.PIXABAY_API_KEY;
    console.log(`[Pixabay] Fetching image for: "${dishName}", Key exists: ${!!pixabayKey}`);
    if (!pixabayKey) return null;

    try {
        const pixabayRes = await fetch(
            `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(dishName + " food")}&per_page=3&orientation=horizontal&image_type=photo`
        );
        console.log(`[Pixabay] Response status for "${dishName}": ${pixabayRes.status}`);
        if (pixabayRes.ok) {
            const pixabayData = await pixabayRes.json() as { hits: Array<{ webformatURL: string; largeImageURL: string }> };
            const url = pixabayData.hits?.[0]?.webformatURL ?? null;
            console.log(`[Pixabay] Image URL for "${dishName}": ${url}`);
            return url;
        } else {
            const errorText = await pixabayRes.text();
            console.warn(`[Pixabay] Error response: ${errorText}`);
        }
    } catch (err) {
        console.warn(`Pixabay fetch failed for "${dishName}":`, err);
    }
    return null;
}

app.post("/analyzeMenu", async (req: Request<{}, {}, AnalyzeMenuRequestBody>, res: Response) => {
    try {
        const imageInput = req.body.imageUrl || req.body.imageBase64;
        if (!imageInput) {
            throw new Error("No image data provided");
        }
        const { mimeType, base64 } = parseBase64Image(imageInput);

        const { object } = await generateObject({
            model: model,
            schema: MenuSchema,
            system: `You are an expert menu scanner and culinary AI assistant. Your job is to:
 1. Extract all visible menu items from the image (name, price, category if visible)
 2. For each dish, INFER realistic data based on the dish name and cuisine type:
    - ingredients: List 5-10 typical ingredients for this dish (be specific and realistic)
    - calories: Estimate realistic calorie count in kcal (e.g., 450)
    - preparationTime: Estimate realistic preparation time in minutes (e.g., 15, 20, 30)
    - description: Write a brief, appetizing 1-2 sentence description of the dish
    - allergens: List common allergens present (e.g., Dairy, Gluten, Nuts)
    - origin: The cuisine origin (e.g., Italian, Japanese, Indian)
    - isVegan/isVegetarian/isGlutenFree: Determine based on the dish
    - price: If not visible in the image, estimate a realistic price in Nepalese Rupees (NPR). Format as "Rs. XXX" (e.g., "Rs. 250", "Rs. 450")

NEVER return null or empty values for ingredients, calories, preparationTime, or description - always infer reasonable values based on the dish name. Be creative but realistic with your estimates.`,
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Extract every visible menu item with complete details. For each dish, provide realistic inferred ingredients, estimated calories, a mouth-watering description, and dietary information based on the dish name." },
                        { type: "image", image: `data:${mimeType};base64,${base64}` },
                    ],
                },
            ],
        });

        const menuItemsWithImages = await Promise.all(
            object.menuItems.map(async (item) => ({
                ...item,
                imageUrl: await fetchPixabayImage(item.name),
            }))
        );

        res.json({
            success: true,
            fullText: object.fullText ?? "",
            menuItems: menuItemsWithImages,
        });
    } catch (err: any) {
        const message = err?.message || "Unknown error";
        const status = message.includes("429") ? 429 : message.includes("404") ? 404 : 500;

        res.status(status).json({
            success: false,
            error:
                status === 429
                    ? "AI Quota reached. Please wait and try again."
                    : message,
        });
    }
});

interface ChatRequestBody {
    message: string;
}

app.post("/chat", async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
    try {
        const { message } = req.body;
        if (!message) throw new Error("Message is required");

        const { text } = await generateText({
            model: model,
            system: "You are a helpful food expert AI. Provide detailed information about the requested food item. You MUST return ONLY a JSON object that strictly follows the provided schema. Do not include any other text, markdown blocks, or explanations. All prices MUST be in Nepalese Rupees (NPR) formatted as 'Rs. XXX' (e.g., 'Rs. 250', 'Rs. 450').",
            prompt: `Return information for "${message}" strictly according to this JSON schema:
            {
                "name": "string",
                "description": "string or null",
                "price": "string or null - format as 'Rs. XXX' in Nepalese Rupees (NPR)",
                "category": "string or null",
                "ingredients": ["string"],
                "allergens": ["string"],
                "calories": "number or null",
                "preparationTime": "number in minutes or null",
                "origin": "string or null",
                "isVegan": "boolean or null",
                "isVegetarian": "boolean or null",
                "isGlutenFree": "boolean or null"
            }`,
        });

        // Extract JSON from potential markdown blocks
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : text;
        const object = JSON.parse(jsonContent);

        // Fetch a dish image from Pixabay
        let imageUrl: string | null = null;
        try {
            const dishName = object.name || message;
            const pixabayKey = process.env.PIXABAY_API_KEY;
            if (pixabayKey) {
                const pixabayRes = await fetch(
                    `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(dishName + " food")}&per_page=3&orientation=horizontal&image_type=photo`
                );
                if (pixabayRes.ok) {
                    const pixabayData = await pixabayRes.json() as { hits: Array<{ webformatURL: string }> };
                    imageUrl = pixabayData.hits?.[0]?.webformatURL ?? null;
                }
            }
        } catch (imgErr) {
            console.warn("Pixabay fetch failed (non-fatal):", imgErr);
        }

        res.json({
            success: true,
            imageUrl,
            data: {
                ...object,
                preparationTime: formatPrepTime(object.preparationTime)
            }
        });

    } catch (err: any) {
        console.error("Chat Error:", err);
        res.status(500).json({ success: false, error: err?.message || "Failed to get AI response" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});