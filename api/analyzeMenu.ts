import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const model = google("gemini-2.5-flash-preview-0506");

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
  menuItems: z.array(FoodItemSchema),
});

interface AnalyzeMenuRequestBody {
  imageUrl?: string;
  imageBase64?: string;
}

async function fetchPixabayImage(dishName: string): Promise<string | null> {
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (!pixabayKey) return null;

  try {
    const pixabayRes = await fetch(
      `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(dishName + " food")}&per_page=3&orientation=horizontal&image_type=photo`
    );
    if (pixabayRes.ok) {
      const pixabayData = await pixabayRes.json() as { hits: Array<{ webformatURL: string; largeImageURL: string }> };
      return pixabayData.hits?.[0]?.webformatURL ?? null;
    }
  } catch (err) {
    console.warn(`Pixabay fetch failed for "${dishName}":`, err);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeMenuRequestBody = await request.json();
    const imageInput = body.imageUrl || body.imageBase64;
    if (!imageInput) {
      throw new Error("No image data provided");
    }
    const { mimeType, base64 } = parseBase64Image(imageInput);

    const { object } = await generateObject({
      model: model,
      schema: MenuSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract every visible menu item with complete details. For each dish, provide realistic inferred ingredients, estimated calories, a mouth-watering description, and dietary information based on the dish name." },
            { type: "image", image: `data:${mimeType};base64,${base64}` },
          ],
        },
      ],
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
    });

    const menuItemsWithImages = await Promise.all(
      object.menuItems.map(async (item) => ({
        ...item,
        imageUrl: await fetchPixabayImage(item.name),
      }))
    );

    return Response.json({
      success: true,
      fullText: object.fullText ?? "",
      menuItems: menuItemsWithImages,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.includes("429") ? 429 : message.includes("404") ? 404 : 500;

    return Response.json(
      {
        success: false,
        error: status === 429 ? "AI Quota reached. Please wait and try again." : message,
      },
      { status }
    );
  }
}