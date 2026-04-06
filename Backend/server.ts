import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";

import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import OpenAI from "openai";
import { Jimp, JimpMime } from "jimp";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

async function compressBase64Image(base64Data: string): Promise<string> {
    const { base64 } = parseBase64Image(base64Data);
    const buffer = Buffer.from(base64, 'base64');
    
    const image = await Jimp.read(buffer);
    image.resize({ w: 256, h: 256 });
    
    const outputBuffer = await image.getBuffer(JimpMime.jpeg);
    return `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
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

async function generateDishImage(dishName: string): Promise<string | null> {
    try {
        console.log(`[GPT-Image] Generating image for: "${dishName}"`);

        const response = await openai.images.generate({
            model: "gpt-image-1.5",
            prompt: `A delicious, appetizing ${dishName} dish, professional food photography, clean white or neutral background, restaurant quality, high resolution, realistic, appetizing, professionally lit`,
            size: "1024x1024",
            quality: "low",
        });

        console.log(`[GPT-Image] Response received for "${dishName}"`);

        if (!response.data || response.data.length === 0) {
            console.warn(`[GPT-Image] No image generated for "${dishName}"`);
            return null;
        }

        const imageItem = response.data[0];
        
        const b64Image = (imageItem as any).b64_json;
        if (!b64Image) {
            console.warn(`[GPT-Image] No base64 data for "${dishName}"`);
            return null;
        }

        const dataUrl = `data:image/png;base64,${b64Image}`;
        console.log(`[GPT-Image] Created image for "${dishName}" (${b64Image.length} bytes)`);
        
        const compressedUrl = await compressBase64Image(dataUrl);
        console.log(`[Jimp] Compressed image for "${dishName}" (${compressedUrl.length} bytes)`);
        return compressedUrl;
    } catch (err: any) {
        console.error(`[GPT-Image] Error for "${dishName}":`, err?.message || err);
        return null;
    }
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

        const dishNames = object.menuItems.map(item => item.name);
        
        console.log(`[GPT-Image] Generating ${dishNames.length} images individually`);
        
        const menuItemsWithImages = await Promise.all(
            object.menuItems.map(async (item) => {
                console.log(`[GPT-Image] Generating image for: "${item.name}"`);
                const imageUrl = await generateDishImage(item.name);
                return {
                    ...item,
                    imageUrl: imageUrl || null,
                };
            })
        );
        
        const missingImages = menuItemsWithImages.filter(item => !item.imageUrl);
        if (missingImages.length > 0) {
            console.log(`[GPT-Image] Retrying ${missingImages.length} failed images`);
            const retryItems = await Promise.all(
                missingImages.map(async (item) => ({
                    ...item,
                    imageUrl: await generateDishImage(item.name),
                }))
            );
            menuItemsWithImages.forEach((item) => {
                if (!item.imageUrl) {
                    const retry = retryItems.find(r => r.name === item.name);
                    if (retry) item.imageUrl = retry.imageUrl;
                }
            });
        }
        
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

        const dishName = object.name || message;
        console.log(`[Chat] Generating image for dish: "${dishName}"`);
        const imageUrl = await generateDishImage(dishName);
        console.log(`[Chat] Image URL result: ${imageUrl}`);

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



app.get("/test-image/:dish", async (req, res) => {
    try {
        const dishName = req.params.dish || "Pizza";
        const imageUrl = await generateDishImage(dishName);
        res.json({ success: true, dishName, imageUrl: imageUrl?.substring(0, 100) + "..." });
    } catch (err: any) {
        res.json({ success: false, error: err?.message || err });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});