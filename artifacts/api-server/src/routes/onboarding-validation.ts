import { Router, type IRouter } from "express";
import { openai, AI_MODEL } from "@workspace/integrations-anthropic-ai";
import { z } from "zod/v4";

const router: IRouter = Router();

const ValidateAnswerBody = z.object({
  questionId: z.string(),
  questionText: z.string(),
  answer: z.string(),
  previousAnswers: z.record(z.string()).optional(),
});

/**
 * POST /api/onboarding/validate-answer
 * Uses AI to intelligently validate user answers and detect wrong/invalid inputs
 */
router.post("/onboarding/validate-answer", async (req, res): Promise<void> => {
  try {
    const parsed = ValidateAnswerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "validation_error", message: parsed.error.message });
      return;
    }

    const { questionId, questionText, answer, previousAnswers = {} } = parsed.data;

    // Build context from previous answers
    const contextStr = Object.keys(previousAnswers).length > 0
      ? `\n\nPrevious answers:\n${Object.entries(previousAnswers)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join("\n")}`
      : "";

    // Special handling for vehicleMake - must be strict about format
    let validationPrompt: string;
    
    if (questionId === "vehicleMake") {
      validationPrompt = `You are a strict validation assistant for vehicle make and model input.

CRITICAL REQUIREMENT:
- The input MUST be in the format: [Company Name] [Car Name]
- Examples of CORRECT format: "Honda Civic", "Toyota Camry", "Ford F-150", "Tesla Model 3", "Chevrolet Silverado"
- Examples of INCORRECT format: "Honda" (only company, missing car name), "Civic" (only car name, missing company), "honda" (incomplete)

VALIDATION RULES:
1. Input must contain AT LEAST 2 words separated by space
2. First word should be a vehicle manufacturer/company name (Honda, Toyota, Ford, etc.)
3. Second word(s) should be the model name (Civic, Camry, F-150, etc.)
4. Reject if only one word is provided (like "Honda" or "Civic")
5. Reject if it doesn't follow the [Company] [Model] format
6. Be extremely strict - if format doesn't match, reject it

Current question: "${questionText}"
User's answer: "${answer}"

Check if the answer follows the format [Company Name] [Car Name]:
- Count the words: ${answer.trim().split(/\s+/).length} words
- If less than 2 words → INVALID
- If 2+ words and first is a known manufacturer → VALID

Respond with ONLY valid JSON:
{
  "isValid": boolean (false if format doesn't match [Company] [Model]),
  "reason": "Brief explanation (if invalid, say 'Please provide both the company name and car model, e.g., Honda Civic or Toyota Camry')",
  "shouldAskAgain": boolean (true if invalid),
  "correctedValue": null
}`;
    } else {
      // General validation for other questions
      validationPrompt = `You are a smart validation assistant for an insurance onboarding chatbot. Your job is to validate user answers and detect if they are wrong, invalid, or nonsensical.

Current question: "${questionText}"
User's answer: "${answer}"
${contextStr}

CRITICAL: FILTER OUT IRRELEVANT INFORMATION
- IGNORE off-topic comments, personal preferences, or unrelated information (e.g., "I love pizza", "I'm hungry", "The weather is nice", etc.)
- When validating, focus ONLY on the part of the answer that is relevant to the question
- If the answer contains BOTH relevant and irrelevant information, validate the relevant part
- If the answer contains ONLY irrelevant information with no answer to the question, mark as INVALID
- Examples:
  * Question: "What's your name?" Answer: "John, I love pizza" → Focus on "John" (relevant), ignore "I love pizza" (irrelevant) → VALID if "John" is a valid name
  * Question: "What's your name?" Answer: "I love pizza" → No name provided, only irrelevant info → INVALID
  * Question: "What's your age?" Answer: "25, I love pizza" → Focus on "25" (relevant), ignore "I love pizza" (irrelevant) → VALID if 25 is in valid range

VALIDATION RULES:
1. **Name validation**: Reject gibberish (like "hbdjbja", "asdfgh"), random keyboard mashing, or non-name strings. Accept reasonable names (first name, or first + last name). Ignore irrelevant comments.

2. **Age validation**: Must be between 16 and 120. Reject impossible ages (0-15, 121+, 150, 200, etc.). Extract numeric age from text, ignoring irrelevant comments.

3. **Vehicle year**: Must be between 1900 and current year + 1. Reject impossible years. Ignore irrelevant comments.

4. **Location**: Must be a real location (city, state, or country). Reject nonsensical places (like "Mars", "Narnia"). Ignore irrelevant comments.

5. **Budget**: Must be a reasonable dollar amount ($20-$2000/month). Reject nonsensical values. Ignore irrelevant comments.

6. **General**: Reject empty answers, obviously wrong answers, answers that don't make sense for the question, or answers that contain ONLY irrelevant information with no actual answer.

Respond with ONLY valid JSON:
{
  "isValid": boolean,
  "reason": "Brief explanation (if invalid, explain what's wrong and what's expected)",
  "shouldAskAgain": boolean,
  "correctedValue": string | null
}`;
    }

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      temperature: 0.3, // Lower temperature for more consistent validation
      max_tokens: 256,
      messages: [
        {
          role: "system",
          content: "You are a validation assistant. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: validationPrompt,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "{}";
    let validationResult: any;

    try {
      validationResult = JSON.parse(content);
    } catch (e) {
      // Fallback: try to extract JSON from markdown
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse validation response");
      }
    }

    // Ensure required fields exist
    const result = {
      isValid: validationResult.isValid === true,
      reason: validationResult.reason || (validationResult.isValid ? "Valid" : "Invalid answer"),
      shouldAskAgain: validationResult.shouldAskAgain === true || validationResult.isValid === false,
      correctedValue: validationResult.correctedValue || null,
    };

    res.json({
      ...result,
      message: result.isValid ? null : result.reason,
    });
  } catch (err) {
    console.error("Validation error:", err);
    res.status(500).json({
      error: "validation_error",
      message: "Failed to validate answer",
      isValid: false,
      shouldAskAgain: true,
    });
  }
});

export default router;
