import { Router, type IRouter } from "express";
import { openai, AI_MODEL } from "../lib/ai.js";
import { schemas } from "@workspace/api-zod";
const { AiChatBody } = schemas;

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are InsureWise, a friendly and knowledgeable AI insurance advisor. Your job is to help users find the perfect insurance policy through a natural conversation.

You need to collect this information (but be conversational, not robotic):
1. Full name
2. Age
3. Location (city and state)
4. Type of insurance needed (auto, home, life, health, or renters)
5. Monthly budget
6. Must-have coverage requirements (specific things they need covered)
7. Priority weights: how important is price vs coverage quality vs insurer rating (should sum to 100%)
8. For auto insurance: vehicle make, model, and year
9. For home insurance: property address, type (house/condo/apartment/townhouse)

Be warm, conversational, and explain things in plain language. Don't ask for all information at once.
Ask 1-2 questions at a time. When you have enough information, extract the profile.

When you have collected all the key information (name, age, location, insurance type, budget, at least one requirement, and priorities), include a JSON block in your response with this exact format:

<profile_data>
{
  "name": "...",
  "age": 0,
  "location": "...",
  "insuranceType": "auto|home|life|health|renters",
  "budgetMonthly": 0,
  "requirements": ["...", "..."],
  "priorities": { "price": 0, "coverage": 0, "rating": 0 },
  "vehicleDetails": { "make": "...", "model": "...", "year": 0 },
  "isComplete": true
}
</profile_data>

Keep responses concise (2-3 sentences max per response unless explaining something important). Be encouraging and positive.`;

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { messages } = parsed.data;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.map((m: any) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const messageText = response.choices[0]?.message?.content ?? "";
    let cleanedMessage = messageText;
    let extractedProfile = undefined;
    let isComplete = false;

    const profileMatch = messageText.match(/<profile_data>([\s\S]*?)<\/profile_data>/);
    if (profileMatch) {
      try {
        const profileJson = JSON.parse(profileMatch[1].trim());
        isComplete = profileJson.isComplete === true;
        delete profileJson.isComplete;
        extractedProfile = profileJson;
        cleanedMessage = messageText.replace(/<profile_data>[\s\S]*?<\/profile_data>/, "").trim();
      } catch (_e) {
        // ignore parse errors
      }
    }

    res.json({
      message: cleanedMessage,
      extractedProfile,
      isComplete,
      nextQuestion: undefined,
    });
  } catch (err) {
    console.error("AI chat error:", err);
    res.status(500).json({ error: "ai_error", message: "Failed to get AI response" });
  }
});

export default router;
