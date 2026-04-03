import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
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

interface ChatRequestBody {
  message: string;
}

async function fetchPixabayImage(dishName: string): Promise<string | null> {
  const pixabayKey = process.env.PIXABAY_API_KEY;
  if (!pixabayKey) return null;

  try {
    const pixabayRes = await fetch(
      `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(dishName + " food")}&per_page=3&orientation=horizontal&image_type=photo`
    );
    if (pixabayRes.ok) {
      const pixabayData = await pixabayRes.json() as { hits: Array<{ webformatURL: string }> };
      return pixabayData.hits?.[0]?.webformatURL ?? null;
    }
  } catch (err) {
    console.warn(`Pixabay fetch failed for "${dishName}":`, err);
  }
  return null;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (path === "/analyzeMenu" || path === "/analyzeMenu/") {
    const response = await handleAnalyzeMenu(request);
    return new Response(response.body, {
      ...response.init,
      headers: { ...response.init.headers, ...corsHeaders },
    });
  } else if (path === "/chat" || path === "/chat/") {
    const response = await handleChat(request);
    return new Response(response.body, {
      ...response.init,
      headers: { ...response.init.headers, ...corsHeaders },
    });
  }

  return Response.json({ error: "Not found" }, { status: 404 });
}

async function handleAnalyzeMenu(request: Request): Promise<Response> {
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
            { type: "text", text: "Extract every visible menu item with complete details." },
            { type: "image", image: `data:${mimeType};base64,${base64}` },
          ],
        },
      ],
      system: `You are an expert menu scanner. Extract menu items and infer details.`,
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
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

async function handleChat(request: Request): Promise<Response> {
  try {
    const body: ChatRequestBody = await request.json();
    const { message } = body;
    if (!message) throw new Error("Message is required");

    const { text } = await generateText({
      model: model,
      system: "You are a helpful food expert AI. Return ONLY JSON.",
      prompt: `Return JSON for "${message}" with name, description, price, category, ingredients, allergens, calories, preparationTime, origin, isVegan, isVegetarian, isGlutenFree.`,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : text;
    const object = JSON.parse(jsonContent);

    const imageUrl = await fetchPixabayImage(object.name || message);

    return Response.json({ success: true, imageUrl, data: object });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to get AI response";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}

export { handler as POST, handler as GET };