import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const model = google("gemini-2.0-flash");

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
    const { message } = body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const { text } = await generateText({
      model: model,
      system: "You are a helpful food expert AI. Return ONLY JSON.",
      prompt: `Return JSON for "${message}" with name, description, price, category, ingredients, allergens, calories, preparationTime, origin, isVegan, isVegetarian, isGlutenFree.`,
    });

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : text;
    const obj = JSON.parse(jsonContent);

    const imageUrl = await fetchPixabayImage(obj.name || message);

    return res.status(200).json({ success: true, imageUrl, data: obj });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}