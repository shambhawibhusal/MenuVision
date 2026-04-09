import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from "cors";
import crypto from "crypto";

import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";

import OpenAI from "openai";
import { Jimp, JimpMime } from "jimp";

import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

const firestore = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const model = google("gemini-2.5-flash-lite");

interface ParsedImage {
    mimeType: string;
    base64: string;
}

function parseBase64Image(input: string): ParsedImage {
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

const normalizeDishName = (name: string): string => {
    return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

const generateHash = (input: string): string => {
    return crypto.createHash('sha256').update(input).digest('hex');
};

async function checkDishImageInDataset(dishName: string): Promise<string | null> {
    try {
        const normalizedName = normalizeDishName(dishName);
        console.log(`[Dataset] Checking dataset for dish: "${normalizedName}"`);
        
        const snapshot = await firestore.collection('menuDataset')
            .where('nameLower', '==', normalizedName)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (data.imageUrl) {
                console.log(`[Dataset] Found cached image for "${dishName}": ${data.imageUrl.substring(0, 50)}...`);
                return data.imageUrl;
            }
            console.log(`[Dataset] Dish "${dishName}" exists but no image`);
        }
        
        console.log(`[Dataset] No cached image for "${dishName}"`);
        return null;
    } catch (error) {
        console.error(`[Dataset] Error checking dish image:`, error);
        return null;
    }
}

async function updateDishInDataset(dishName: string, imageUrl: string): Promise<void> {
    try {
        const normalizedName = normalizeDishName(dishName);
        
        const snapshot = await firestore.collection('menuDataset')
            .where('nameLower', '==', normalizedName)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const docRef = snapshot.docs[0].ref;
            await docRef.update({
                imageUrl: imageUrl,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[Dataset] Updated image for dish: "${dishName}"`);
        }
    } catch (error) {
        console.error(`[Dataset] Error updating dish:`, error);
    }
}

const generateDishId = (name: string): string => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

async function checkDishInDataset(dishName: string): Promise<any | null> {
    try {
        const normalizedName = normalizeDishName(dishName);
        console.log(`[Dataset] Checking for dish: "${normalizedName}"`);
        
        const snapshot = await firestore.collection('menuDataset')
            .where('nameLower', '==', normalizedName)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            console.log(`[Dataset] Found dish "${dishName}" in dataset`);
            return {
                id: snapshot.docs[0].id,
                ...data
            };
        }
        
        console.log(`[Dataset] Dish "${dishName}" not found in dataset`);
        return null;
    } catch (error) {
        console.error(`[Dataset] Error checking dish:`, error);
        return null;
    }
}

async function saveDishToDataset(dishData: {
    name: string;
    description?: string | null;
    price?: string | null;
    category?: string | null;
    ingredients?: string[];
    allergens?: string[];
    calories?: number | null;
    preparationTime?: number | null;
    origin?: string | null;
    isVegan?: boolean | null;
    isVegetarian?: boolean | null;
    isGlutenFree?: boolean | null;
    imageUrl?: string | null;
}): Promise<string | null> {
    try {
        const normalizedName = normalizeDishName(dishData.name);
        
        const snapshot = await firestore.collection('menuDataset')
            .where('nameLower', '==', normalizedName)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            console.log(`[Dataset] Dish "${dishData.name}" already exists, skipping save`);
            return snapshot.docs[0].id;
        }
        
        const dishId = generateDishId(dishData.name);
        const docRef = firestore.collection('menuDataset').doc(dishId);
        
        let imageUrlToStore: string | null = null;
        if (dishData.imageUrl && !dishData.imageUrl.startsWith('data:image')) {
            imageUrlToStore = dishData.imageUrl;
        } else if (dishData.imageUrl && dishData.imageUrl.startsWith('data:image')) {
            if (dishData.imageUrl.length < 200000) {
                imageUrlToStore = dishData.imageUrl;
            } else {
                console.log(`[Dataset] Skipping large image for "${dishData.name}"`);
            }
        }
        
        await docRef.set({
            name: dishData.name,
            nameLower: normalizedName,
            description: dishData.description || null,
            price: dishData.price || null,
            category: dishData.category || null,
            ingredients: dishData.ingredients || [],
            allergens: dishData.allergens || [],
            calories: dishData.calories || null,
            preparationTime: dishData.preparationTime || null,
            origin: dishData.origin || null,
            isVegan: dishData.isVegan || null,
            isVegetarian: dishData.isVegetarian || null,
            isGlutenFree: dishData.isGlutenFree || null,
            imageUrl: imageUrlToStore,
            scanCount: 1,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`[Dataset] Saved new dish: "${dishData.name}" with ID: ${dishId}`);
        return dishId;
    } catch (error) {
        console.error(`[Dataset] Error saving dish:`, error);
        return null;
    }
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
    const cachedImage = await checkDishImageInDataset(dishName);
    if (cachedImage) {
        return cachedImage;
    }
    
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
        
        await updateDishInDataset(dishName, compressedUrl);
        
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
        
        console.log(`[Dataset] Processing ${dishNames.length} dishes from menu scan`);
        
        let fromCache = false;
        const menuItemsWithImages = await Promise.all(
            object.menuItems.map(async (item) => {
                const existingDish = await checkDishInDataset(item.name);
                
                if (existingDish) {
                    console.log(`[Dataset] Reusing existing dish: "${item.name}"`);
                    fromCache = true;
                    return {
                        name: item.name,
                        price: item.price || existingDish.price,
                        description: existingDish.description,
                        category: item.category || existingDish.category,
                        ingredients: existingDish.ingredients || [],
                        allergens: existingDish.allergens || [],
                        calories: existingDish.calories,
                        preparationTime: existingDish.preparationTime,
                        origin: existingDish.origin,
                        isVegan: existingDish.isVegan,
                        isVegetarian: existingDish.isVegetarian,
                        isGlutenFree: existingDish.isGlutenFree,
                        imageUrl: existingDish.imageUrl,
                        fromDataset: true
                    };
                }
                
                console.log(`[Dataset] New dish found: "${item.name}" - generating image`);
                const imageUrl = await generateDishImage(item.name);
                
                await saveDishToDataset({
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    category: item.category,
                    ingredients: item.ingredients,
                    allergens: item.allergens,
                    calories: item.calories,
                    preparationTime: item.preparationTime,
                    origin: item.origin,
                    isVegan: item.isVegan,
                    isVegetarian: item.isVegetarian,
                    isGlutenFree: item.isGlutenFree,
                    imageUrl: imageUrl
                });
                
                return {
                    ...item,
                    imageUrl: imageUrl || null,
                    fromDataset: false
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
            fromCache
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

        const existingDish = await checkDishInDataset(message);
        
        if (existingDish) {
            console.log(`[Dataset] Found existing dish for query: "${message}"`);
            return res.json({
                success: true,
                imageUrl: existingDish.imageUrl,
                data: {
                    name: existingDish.name,
                    description: existingDish.description,
                    price: existingDish.price,
                    category: existingDish.category,
                    ingredients: existingDish.ingredients,
                    allergens: existingDish.allergens,
                    calories: existingDish.calories,
                    preparationTime: existingDish.preparationTime,
                    origin: existingDish.origin,
                    isVegan: existingDish.isVegan,
                    isVegetarian: existingDish.isVegetarian,
                    isGlutenFree: existingDish.isGlutenFree
                },
                fromCache: true
            });
        }

        console.log(`[Dataset] Dish not found for query: "${message}" - calling AI`);

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

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonContent = jsonMatch ? jsonMatch[0] : text;
        const object = JSON.parse(jsonContent);

        const dishName = object.name || message;
        console.log(`[Chat] Processing image for dish: "${dishName}"`);
        const imageUrl = await generateDishImage(dishName);
        console.log(`[Chat] Image URL result: ${imageUrl}`);

        const formattedData = {
            ...object,
            preparationTime: formatPrepTime(object.preparationTime)
        };

        await saveDishToDataset({
            name: dishName,
            description: object.description,
            price: object.price,
            category: object.category,
            ingredients: object.ingredients,
            allergens: object.allergens,
            calories: object.calories,
            preparationTime: object.preparationTime,
            origin: object.origin,
            isVegan: object.isVegan,
            isVegetarian: object.isVegetarian,
            isGlutenFree: object.isGlutenFree,
            imageUrl: imageUrl
        });

        res.json({
            success: true,
            imageUrl,
            data: formattedData,
            fromCache: false
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