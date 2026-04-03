import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";

const model = google("gemini-2.0-flash");

function parseBase64Image(input: string) {
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

export default async function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  try {
    const body = req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) : {};
    const imageInput = body.imageUrl || body.imageBase64;
    if (!imageInput) {
      return res.status(400).json({ error: "No image data provided" });
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
      system: "You are an expert menu scanner.",
    });

    const menuItemsWithImages = await Promise.all(
      object.menuItems.map(async (item: any) => ({
        ...item,
        imageUrl: await fetchPixabayImage(item.name),
      }))
    );

    return res.status(200).json({
      success: true,
      fullText: object.fullText ?? "",
      menuItems: menuItemsWithImages,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}