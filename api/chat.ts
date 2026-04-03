import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const model = google("gemini-2.5-flash-preview-0506");

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

export async function POST(request: Request) {
  try {
    const body: ChatRequestBody = await request.json();
    const { message } = body;
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

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const jsonContent = jsonMatch ? jsonMatch[0] : text;
    const object = JSON.parse(jsonContent);

    let imageUrl: string | null = null;
    try {
      const dishName = object.name || message;
      imageUrl = await fetchPixabayImage(dishName);
    } catch (imgErr) {
      console.warn("Pixabay fetch failed (non-fatal):", imgErr);
    }

    return Response.json({
      success: true,
      imageUrl,
      data: object,
    });
  } catch (err: unknown) {
    console.error("Chat Error:", err);
    const message = err instanceof Error ? err.message : "Failed to get AI response";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}