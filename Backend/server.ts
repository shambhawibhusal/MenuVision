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
    priceMin?: string | null;
    priceMax?: string | null;
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
    nutrition: {
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber: number;
        sodium: number;
    };
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
            priceMin: dishData.priceMin || null,
            priceMax: dishData.priceMax || null,
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
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            nutrition: dishData.nutrition || null
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
    priceMin: z.string().nullable().optional(),
    priceMax: z.string().nullable().optional(),
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
    nutrition: z.object({
        protein: z.number(),
        carbohydrates: z.number(),
        fat: z.number(),
        fiber: z.number(),
        sodium: z.number(),
    }),
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
      - nutrition: Estimate nutritional values per serving - MUST provide ALL 5 values:
        - protein: grams (e.g., 25)
        - carbohydrates: grams (e.g., 45)
        - fat: grams (e.g., 15)
        - fiber: grams (e.g., 5)
        - sodium: milligrams (e.g., 400)

NEVER return null or empty values for ingredients, calories, preparationTime, or description - always infer reasonable values based on the dish name. Be creative but realistic with your estimates.
ALWAYS provide values for ALL nutrition fields (protein, carbohydrates, fat, fiber, sodium) - NEVER return null for any nutrition field.`,
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
                
                const normalizedNutrition = item.nutrition ? {
                    protein: item.nutrition.protein ?? 0,
                    carbohydrates: item.nutrition.carbohydrates ?? 0,
                    fat: item.nutrition.fat ?? 0,
                    fiber: item.nutrition.fiber ?? 0,
                    sodium: item.nutrition.sodium ?? 0
                } : { protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sodium: 0 };
                
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
                        fromDataset: true,
                        nutrition: existingDish.nutrition ? {
                            protein: existingDish.nutrition.protein ?? 0,
                            carbohydrates: existingDish.nutrition.carbohydrates ?? 0,
                            fat: existingDish.nutrition.fat ?? 0,
                            fiber: existingDish.nutrition.fiber ?? 0,
                            sodium: existingDish.nutrition.sodium ?? 0
                        } : normalizedNutrition
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
                    imageUrl: imageUrl,
                    nutrition: normalizedNutrition
                });
                
                return {
                    ...item,
                    imageUrl: imageUrl || null,
                    fromDataset: false,
                    nutrition: normalizedNutrition
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
    foodProfile?: {
        isVegetarian: boolean;
        isVegan: boolean;
        isGlutenFree: boolean;
        allergens: string[];
    };
}

function buildUserContext(profile?: ChatRequestBody["foodProfile"]): string {
    if (!profile) return "";
    const parts: string[] = [];
    if (profile.isVegan) parts.push("the user is vegan (strictly no animal products, including dairy, eggs, and honey)");
    else if (profile.isVegetarian) parts.push("the user is vegetarian (no meat, poultry, or fish)");
    if (profile.isGlutenFree) parts.push("the user is gluten-free (no wheat, barley, rye, or gluten-containing ingredients)");
    if (profile.allergens.length > 0) parts.push(`the user is allergic to: ${profile.allergens.join(", ")}`);
    if (parts.length === 0) return "";
    return `\n\nIMPORTANT USER DIETARY CONTEXT: ${parts.join("; ")}. You MUST ONLY recommend, suggest, or mention foods that are SAFE and COMPATIBLE with these dietary restrictions. If the user asks about or mentions dishes that conflict with these restrictions, politely explain why and suggest suitable alternatives.`;
}

const ChatFoodItemSchema = FoodItemSchema.extend({
    priceMin: z.string(),
    priceMax: z.string(),
});

const ChatResponseSchema = z.object({
    response: z.string(),
    dishes: z.array(ChatFoodItemSchema)
});

async function searchMenuDataset(searchTerm: string): Promise<any[]> {
    try {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        const snapshot = await firestore.collection('menuDataset')
            .where('nameLower', '>=', normalizedSearch)
            .where('nameLower', '<=', normalizedSearch + '\uf8ff')
            .limit(5)
            .get();

        if (snapshot.empty) return [];

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('[Dataset] Error searching dataset:', error);
        return [];
    }
}

const STOPWORDS = new Set([
    'a', 'an', 'the', 'me', 'show', 'find', 'give', 'tell', 'what', 'suggest', 'recommend', 'search',
    'are', 'is', 'any', 'some', 'for', 'about', 'can', 'you', 'please', 'i', 'want', 'need', 'looking',
    'help', 'with', 'dishes', 'dish', 'food', 'items', 'recipe', 'of', 'in', 'like', 'that', 'have',
    'to', 'and', 'or', 'it', 'this', 'these', 'those', 'something', 'good', 'best', 'popular',
    'maybe', 'how', 'do', 'does', 'could', 'would', 'should', 'get', 'list', 'see', 'has', 'had',
    'been', 'be', 'we', 'they', 'he', 'she', 'his', 'her', 'our', 'your', 'my', 'there', 'here',
    'from', 'just', 'only', 'also', 'too', 'very', 'more', 'not', 'now', 'then', 'than', 'by',
    'compare', 'versus', 'vs', 'difference', 'between', 'which', 'who', 'where', 'when',
    'why', 'know', 'think', 'trying', 'wish', 'let', 'make', 'made', 'all', 'each',
    'every', 'one', 'two', 'three', 'few', 'many', 'much', 'lot', 'lots'
]);

function extractSearchKeywords(query: string): string[] {
    const words = query.toLowerCase().trim().split(/[\s,!.?;:]+/).filter(w => w.length > 1);
    const keywords = words.filter(w => !STOPWORDS.has(w));
    return [...new Set(keywords)];
}

function computePriceRange(price: string | null | undefined): { priceMin: string; priceMax: string } {
    if (price && price !== 'Price not available' && price !== 'N/A') {
        const match = price.replace(/[^0-9.]/g, '').match(/(\d+\.?\d*)/);
        if (match) {
            const value = parseFloat(match[0]);
            if (value > 0) {
                const min = Math.round(value * 0.8);
                const max = Math.round(value * 1.2);
                return { priceMin: `Rs. ${min}`, priceMax: `Rs. ${max}` };
            }
        }
    }
    return { priceMin: 'Rs. 150', priceMax: 'Rs. 450' };
}

function getPriceRangeForDish(dish: any): { priceMin: string; priceMax: string } {
    if (dish.priceMin && dish.priceMax) return { priceMin: dish.priceMin, priceMax: dish.priceMax };
    return computePriceRange(dish.price);
}

app.post("/chat", async (req: Request<{}, {}, ChatRequestBody>, res: Response) => {
    try {
        const { message, foodProfile } = req.body;
        if (!message) throw new Error("Message is required");

        const dietaryContext = buildUserContext(foodProfile);

        const keywords = extractSearchKeywords(message);

        const combinedMatches: any[] = [];
        const seenIds = new Set<string>();

        if (keywords.length > 0) {
            for (const kw of keywords) {
                const matches = await searchMenuDataset(kw);
                for (const match of matches) {
                    if (!seenIds.has(match.id)) {
                        seenIds.add(match.id);
                        combinedMatches.push(match);
                    }
                }
            }
        }

        if (combinedMatches.length > 0) {
            console.log(`[Chat] Found ${combinedMatches.length} dataset matches for keywords: [${keywords.join(', ')}]`);

            const dishList = combinedMatches.map(d =>
                `${d.name}${d.price ? ' (' + d.price + ')' : ''}${d.place ? ' from ' + d.place : ''}${d.description ? ': ' + d.description : ''}`
            ).join('; ');

            const { text } = await generateText({
                model: model,
                system: `You are a friendly food expert AI. Write a short, helpful, conversational response to the user's query. Naturally mention the dishes you're about to show. Keep it warm and brief.${dietaryContext}`,
                prompt: `The user asked: "${message}". We found these dishes in our collection: ${dishList}. Write a short conversational reply introducing these dishes to the user.${dietaryContext}`,
            });

            const formattedDishes = combinedMatches.map(d => {
                const range = getPriceRangeForDish(d);
                return {
                    name: d.name,
                    description: d.description || null,
                    price: d.price || null,
                    priceMin: range.priceMin,
                    priceMax: range.priceMax,
                    category: d.category || null,
                    ingredients: d.ingredients || [],
                    allergens: d.allergens || [],
                    calories: d.calories || null,
                    preparationTime: formatPrepTime(d.preparationTime),
                    origin: d.origin || null,
                    isVegan: d.isVegan ?? null,
                    isVegetarian: d.isVegetarian ?? null,
                    isGlutenFree: d.isGlutenFree ?? null,
                    imageUrl: d.imageUrl || null,
                    nutrition: d.nutrition || { protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sodium: 0 }
                };
            });

            res.json({
                success: true,
                replyText: text.trim(),
                dishes: formattedDishes,
                fromCache: true
            });
            return;
        }

        console.log(`[Chat] No dataset matches - calling AI for: "${message}"`);

        const { object } = await generateObject({
            model: model,
            schema: ChatResponseSchema,
            system: `You are a friendly and knowledgeable food expert AI assistant. Respond conversationally and helpfully to the user's query about food dishes, cuisines, ingredients, or nutrition. Provide interesting information, cultural context, preparation insights, or recommendations as appropriate. Then include structured dish data for the dishes you mention in your response. For each dish, provide a realistic estimated market price range using priceMin (lowest typical market price) and priceMax (highest typical market price). All prices MUST be in Nepalese Rupees (NPR) formatted as 'Rs. XXX' (e.g., price: 'Rs. 250', priceMin: 'Rs. 200', priceMax: 'Rs. 300'). The price field can be used for the typical/average single price. ALWAYS provide values for ALL nutrition fields (protein, carbohydrates, fat, fiber, sodium) - NEVER return null for any nutrition field. If the user's query is not about a specific food dish, you may return an empty dishes array and respond conversationally.${dietaryContext}`,
            messages: [
                { role: "user", content: [{ type: "text", text: message }] },
            ],
        });

        const replyText = object.response;
        const llmDishes = object.dishes;
        let anyFromCache = false;

        const processedDishes = await Promise.all(
            llmDishes.map(async (dish) => {
                const existingDish = await checkDishInDataset(dish.name);

                const normalizedNutrition = dish.nutrition ? {
                    protein: dish.nutrition.protein ?? 0,
                    carbohydrates: dish.nutrition.carbohydrates ?? 0,
                    fat: dish.nutrition.fat ?? 0,
                    fiber: dish.nutrition.fiber ?? 0,
                    sodium: dish.nutrition.sodium ?? 0
                } : { protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sodium: 0 };

                if (existingDish) {
                    anyFromCache = true;
                    console.log(`[Dataset] Found cached dish: "${dish.name}"`);
                    const range = getPriceRangeForDish(existingDish);
                    return {
                        name: dish.name,
                        description: existingDish.description,
                        price: existingDish.price,
                        priceMin: range.priceMin,
                        priceMax: range.priceMax,
                        category: existingDish.category,
                        ingredients: existingDish.ingredients || [],
                        allergens: existingDish.allergens || [],
                        calories: existingDish.calories,
                        preparationTime: existingDish.preparationTime,
                        origin: existingDish.origin,
                        isVegan: existingDish.isVegan,
                        isVegetarian: existingDish.isVegetarian,
                        isGlutenFree: existingDish.isGlutenFree,
                        imageUrl: existingDish.imageUrl || null,
                        nutrition: existingDish.nutrition ? {
                            protein: existingDish.nutrition.protein ?? 0,
                            carbohydrates: existingDish.nutrition.carbohydrates ?? 0,
                            fat: existingDish.nutrition.fat ?? 0,
                            fiber: existingDish.nutrition.fiber ?? 0,
                            sodium: existingDish.nutrition.sodium ?? 0
                        } : normalizedNutrition
                    };
                }

                console.log(`[Chat] New dish: "${dish.name}" - generating image`);
                const imageUrl = await generateDishImage(dish.name);

                await saveDishToDataset({
                    name: dish.name,
                    description: dish.description,
                    price: dish.price,
                    priceMin: dish.priceMin,
                    priceMax: dish.priceMax,
                    category: dish.category,
                    ingredients: dish.ingredients,
                    allergens: dish.allergens,
                    calories: dish.calories,
                    preparationTime: dish.preparationTime,
                    origin: dish.origin,
                    isVegan: dish.isVegan,
                    isVegetarian: dish.isVegetarian,
                    isGlutenFree: dish.isGlutenFree,
                    imageUrl: imageUrl,
                    nutrition: normalizedNutrition
                });

                const range = getPriceRangeForDish({
                    price: dish.price,
                    priceMin: dish.priceMin,
                    priceMax: dish.priceMax
                });

                return {
                    name: dish.name,
                    description: dish.description,
                    price: dish.price,
                    priceMin: range.priceMin,
                    priceMax: range.priceMax,
                    category: dish.category,
                    ingredients: dish.ingredients,
                    allergens: dish.allergens,
                    calories: dish.calories,
                    preparationTime: formatPrepTime(dish.preparationTime),
                    origin: dish.origin,
                    isVegan: dish.isVegan,
                    isVegetarian: dish.isVegetarian,
                    isGlutenFree: dish.isGlutenFree,
                    imageUrl: imageUrl || null,
                    nutrition: normalizedNutrition
                };
            })
        );

        res.json({
            success: true,
            replyText,
            dishes: processedDishes,
            fromCache: anyFromCache
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