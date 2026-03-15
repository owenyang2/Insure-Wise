import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import path from "node:path";
import { Router, type IRouter } from "express";
import { z } from "zod";
import { openai, AI_MODEL } from "@workspace/integrations-anthropic-ai";
import { schemas } from "@workspace/api-zod";
const { SearchPoliciesBody, ExplainPolicyBody, GetApplicationFormBody, SubmitApplicationBody, AiParseAnswerBody, AskExpertBody } = schemas;
import { db, userProfilesTable, applicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getPoliciesForType, scoreAndRankPolicies } from "../lib/mockPolicies.js";

const router: IRouter = Router();

router.post("/insurance/search", async (req, res): Promise<void> => {
  const parsed = SearchPoliciesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { insuranceType, priorities, requirements, budgetMonthly } = parsed.data;
  const start = Date.now();

  const rawPolicies = getPoliciesForType(insuranceType);
  const ranked = scoreAndRankPolicies(rawPolicies, priorities, budgetMonthly, requirements);

  const policies = ranked.map(p => {
    const coveredReqs = requirements.filter((r: string) => {
      const key = r.toLowerCase().trim();
      const match = Object.entries(p.coverageMap).find(([k]) =>
        key === k.toLowerCase().trim() ||
        k.toLowerCase().includes(key) ||
        key.includes(k.toLowerCase())
      );
      return match && match[1].status === "covered";
    });
    const gapReqs = requirements.filter((r: string) => {
      const key = r.toLowerCase().trim();
      const match = Object.entries(p.coverageMap).find(([k]) =>
        key === k.toLowerCase().trim() ||
        k.toLowerCase().includes(key) ||
        key.includes(k.toLowerCase())
      );
      return !match || match[1].status !== "covered";
    });

    return {
      id: p.id,
      insurerName: p.insurerName,
      insurerLogo: p.insurerLogo,
      planName: p.planName,
      monthlyPremium: p.monthlyPremium,
      annualPremium: p.annualPremium,
      deductible: p.deductible,
      matchScore: p.baseMatchScore,
      priceScore: p.priceScore,
      coverageScore: p.coverageScore,
      ratingScore: p.ratingScore,
      overallRating: p.overallRating,
      reviewCount: p.reviewCount,
      coverageSummary: Object.entries(p.coverageMap).slice(0, 5).map(([name, v]) => ({
        type: name,
        name: name.replace(/_/g, " "),
        status: v.status,
        details: v.details,
        limit: v.limit,
      })),
      gapCount: gapReqs.length,
      highlights: p.highlights,
      warnings: [...p.warnings, ...gapReqs.map((r: string) => `Missing: ${r}`)],
    };
  });

  res.json({
    policies,
    totalFound: policies.length,
    searchDuration: (Date.now() - start) / 1000,
  });
});

router.post("/insurance/policies/:policyId/explain", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.policyId) ? req.params.policyId[0] : req.params.policyId;

  const bodyParsed = ExplainPolicyBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "validation_error", message: bodyParsed.error.message });
    return;
  }

  const { requirements, userContext } = bodyParsed.data;

  // Find the policy in mock data
  const allPolicies = [...getPoliciesForType("auto"), ...getPoliciesForType("home")];
  const policy = allPolicies.find(p => p.id === rawId);

  if (!policy) {
    res.status(404).json({ error: "not_found", message: "Policy not found" });
    return;
  }

  // Build coverage items from policy coverage map
  const coverageItems = requirements.map((req: string) => {
    const key = req.toLowerCase().trim();
    const match = Object.entries(policy.coverageMap).find(([k]) =>
      key === k.toLowerCase().trim() ||
      k.toLowerCase().includes(key) ||
      key.includes(k.toLowerCase())
    );
    if (match) {
      return {
        requirement: req,
        status: match[1].status,
        explanation: match[1].details,
        policyClause: `Section covering ${match[0]}`,
        confidence: 0.9,
      };
    }
    return {
      requirement: req,
      status: "not_covered" as const,
      explanation: `${req} is not covered under this policy`,
      policyClause: "N/A",
      confidence: 0.7,
    };
  });

  const covered = coverageItems.filter((c: any) => c.status === "covered").map((c: any) => c.requirement);
  const partial = coverageItems.filter((c: any) => c.status === "partial").map((c: any) => c.requirement);
  const gaps = coverageItems.filter((c: any) => c.status === "not_covered").map((c: any) => c.requirement);

  // Use AI for summary and key terms
  let summary = `${policy.insurerName} ${policy.planName} provides ${covered.length} of your ${requirements.length} required coverages.`;
  let recommendation = gaps.length === 0
    ? "This policy meets all your stated requirements. It's a strong match."
    : `This policy is missing ${gaps.length} coverage(s) you need: ${gaps.join(", ")}. Consider if these gaps are acceptable or look for another policy.`;
  const keyTerms = [
    { term: "Deductible", definition: `The amount you pay out-of-pocket before insurance kicks in. This policy has a $${policy.deductible} deductible.` },
    { term: "Premium", definition: `The monthly cost of your insurance. This policy costs $${policy.monthlyPremium}/month.` },
    { term: "Comprehensive Coverage", definition: "Covers damage to your vehicle from non-collision events like theft, weather, or fire." },
    { term: "Liability Coverage", definition: "Pays for damages you cause to others in an accident." },
  ];

  try {
    const aiResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "system",
          content: "You are an insurance expert. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: `Analyze this policy and provide a brief plain-language summary (2-3 sentences) for someone who needs: ${requirements.join(", ")}.

Policy: ${policy.insurerName} ${policy.planName}
Monthly premium: $${policy.monthlyPremium}
Deductible: $${policy.deductible}
Covered requirements: ${covered.join(", ") || "none"}
Gaps: ${gaps.join(", ") || "none"}

Respond with ONLY a JSON object: {"summary": "...", "recommendation": "..."}`,
        },
      ],
    });

    const raw = aiResponse.choices[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      summary = parsed.summary || summary;
      recommendation = parsed.recommendation || recommendation;
    }
  } catch (_err) {
    // Use fallback values
  }

  res.json({
    policyId: rawId,
    summary,
    coverageItems,
    covered,
    partial,
    gaps,
    recommendation,
    keyTerms,
  });
});

router.post("/insurance/policies/:policyId/application", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.policyId) ? req.params.policyId[0] : req.params.policyId;

  const bodyParsed = GetApplicationFormBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "validation_error", message: bodyParsed.error.message });
    return;
  }

  const { userProfileId } = bodyParsed.data;
  const sessionId = req.headers["x-session-id"] as string || "default-session";

  const allPolicies = [...getPoliciesForType("auto"), ...getPoliciesForType("home")];
  const policy = allPolicies.find(p => p.id === rawId);

  if (!policy) {
    res.status(404).json({ error: "not_found", message: "Policy not found" });
    return;
  }

  // Get user profile if available
  const [profile] = await db
    .select()
    .from(userProfilesTable)
    .where(eq(userProfilesTable.sessionId, sessionId));

  const vehicle = profile?.vehicleDetails as { make?: string; model?: string; year?: number } | null;
  const autoFilledCount = profile ? 8 : 0;

  const sections = [
    {
      title: "Personal Information",
      fields: [
        { fieldId: "first_name", label: "First Name", value: profile?.name?.split(" ")[0] || "", fieldType: "text" as const, required: true, editable: true },
        { fieldId: "last_name", label: "Last Name", value: profile?.name?.split(" ").slice(1).join(" ") || "", fieldType: "text" as const, required: true, editable: true },
        { fieldId: "age", label: "Age", value: profile?.age?.toString() || "", fieldType: "number" as const, required: true, editable: true },
        { fieldId: "location", label: "State / ZIP", value: profile?.location || "", fieldType: "text" as const, required: true, editable: true },
        { fieldId: "email", label: "Email Address", value: "", fieldType: "text" as const, required: true, editable: true },
        { fieldId: "phone", label: "Phone Number", value: "", fieldType: "text" as const, required: false, editable: true },
      ],
    },
    {
      title: "Vehicle Information",
      fields: [
        { fieldId: "vehicle_make", label: "Vehicle Make", value: vehicle?.make || "", fieldType: "text" as const, required: true, editable: true },
        { fieldId: "vehicle_model", label: "Vehicle Model", value: vehicle?.model || "", fieldType: "text" as const, required: true, editable: true },
        { fieldId: "vehicle_year", label: "Vehicle Year", value: vehicle?.year?.toString() || "", fieldType: "number" as const, required: true, editable: true },
        { fieldId: "vin", label: "VIN (optional)", value: "", fieldType: "text" as const, required: false, editable: true },
        { fieldId: "annual_mileage", label: "Annual Mileage", value: "12000", fieldType: "number" as const, required: true, editable: true },
        { fieldId: "primary_use", label: "Primary Use", value: "commute", fieldType: "select" as const, options: ["commute", "pleasure", "business", "farm"], required: true, editable: true },
      ],
    },
    {
      title: "Coverage & Payment",
      fields: [
        { fieldId: "deductible", label: "Deductible", value: policy.deductible.toString(), fieldType: "text" as const, required: true, editable: false },
        { fieldId: "monthly_premium", label: "Monthly Premium", value: `$${policy.monthlyPremium}`, fieldType: "text" as const, required: true, editable: false },
        { fieldId: "start_date", label: "Coverage Start Date", value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], fieldType: "date" as const, required: true, editable: true },
        { fieldId: "payment_method", label: "Payment Method", value: "credit_card", fieldType: "select" as const, options: ["credit_card", "bank_transfer", "check"], required: true, editable: true },
      ],
    },
  ];

  const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0);

  res.json({
    policyId: rawId,
    insurerName: policy.insurerName,
    planName: policy.planName,
    monthlyPremium: policy.monthlyPremium,
    sections,
    autoFilledCount,
    totalFieldCount: totalFields,
  });
});

router.post("/insurance/applications/submit", async (req, res): Promise<void> => {
  try {
    const { policyId, userProfileId, fields } = SubmitApplicationBody.parse(req.body);

    // Get policy details from mock data (in real life, from DB)
    const insuranceType = policyId.startsWith("home") ? "home" : "auto";
    const policies = getPoliciesForType(insuranceType);
    const policy = policies.find((p: any) => p.id === policyId);

    if (!policy) {
      res.status(404).json({ error: "not_found", message: "Policy not found" });
      return;
    }

    // Convert fields array to a JSON object
    const formData = fields.reduce((acc: any, f: any) => {
      acc[f.fieldId] = f.value;
      return acc;
    }, {} as Record<string, string>);

    // Insert into DB
    const confirmationId = randomUUID();
    await db.insert(applicationsTable).values({
      id: confirmationId,
      userProfileId: Number(userProfileId),
      policyId,
      insurerName: policy.insurerName,
      planName: policy.planName,
      monthlyPremium: Math.round(policy.monthlyPremium * 100), // store as cents
      status: "submitted",
      formData,
    });

    const mockPolicyNumber = `POL-${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`;
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);

    const summary = policy.coverageMap ? Object.keys(policy.coverageMap)
      .filter(k => policy.coverageMap[k].status === "covered" || policy.coverageMap[k].status === "partial")
      .slice(0, 3)
      .map(k => k.charAt(0).toUpperCase() + k.slice(1)) : [];

    res.json({
      confirmationId,
      policyNumber: mockPolicyNumber,
      insurerName: policy.insurerName,
      planName: policy.planName,
      startDate: nextMonth.toISOString().split("T")[0],
      monthlyPremium: policy.monthlyPremium,
      coverageSummary: summary,
      status: "submitted",
      message: "Your application has been received and is pending final review.",
    });
  } catch (err: any) {
    console.error("Submit application error:", err);
    res.status(500).json({ error: "application_error", message: err.message || "Failed to submit application" });
  }
});

// ─── Premium Optimizer ───────────────────────────────────────────────────────

router.post("/insurance/optimize-profile", async (req, res): Promise<void> => {
  const { profile } = req.body;
  if (!profile) {
    res.status(400).json({ error: "validation_error", message: "profile is required" });
    return;
  }

  const { name, insuranceType, location, age, budgetMonthly, vehicleDetails, requirements } = profile;

  const prompt = `You are an expert insurance advisor AI. Analyze this customer profile and generate exactly 5 highly specific, personalized, and actionable tips to reduce their insurance premium. Be hyper-specific — mention real neighborhoods, real credit score thresholds, real deductible amounts, real discounts. Do NOT be generic.

Customer Profile:
- Name: ${name}
- Insurance Type: ${insuranceType}
- Location: ${location}
- Age: ${age}
- Monthly Budget: $${budgetMonthly}
${vehicleDetails ? `- Vehicle: ${vehicleDetails.year} ${vehicleDetails.make} ${vehicleDetails.model}` : ""}
${requirements?.length ? `- Coverage requirements: ${requirements.join(", ")}` : ""}

For ${insuranceType} insurance in ${location}, generate 5 tips. Each tip must be:
1. Hyper-specific to their location, age, vehicle, or situation
2. Include a concrete estimated monthly savings amount (e.g. "$18–$34/month")
3. Include a clear action they can take RIGHT NOW
4. Categorized as: location | credit | deductible | bundling | vehicle | safety | lifestyle

Examples of the specificity level expected:
- Auto in Toronto: "Your postal code M5V has 38% higher collision rates than M9A (Etobicoke West). Switching your garaging address to a lower-risk postal code could save $45–$70/month."
- Home: "Raising your credit score from 680 to 720 unlocks the 'preferred tier' at most home insurers, saving $22–$41/month on your premium."
- Auto: "Adding a winter tire discount (documented with receipts) can save $15–$25/month in Ontario — 90% of drivers don't claim this."

Respond ONLY with valid JSON in this exact format:
{
  "tips": [
    {
      "id": "tip_1",
      "title": "Short action-oriented title",
      "description": "2–3 sentence hyper-specific explanation with numbers and real context",
      "category": "location|credit|deductible|bundling|vehicle|safety|lifestyle",
      "minSavings": 0,
      "maxSavings": 0,
      "impact": "high|medium|low",
      "actionLabel": "Short CTA button text",
      "profileField": "location|budgetMonthly|null"
    }
  ],
  "personalizedQuote": "A 1-sentence personalized insight for ${name} about their specific situation — mention their location and insurance type specifically."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 1200,
      messages: [
        { role: "system", content: "You are an expert insurance advisor. Respond only with valid JSON." },
        { role: "user", content: prompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    let parsed: any;
    try {
      // First try to extract just JSON
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try parsing the whole thing
        parsed = JSON.parse(raw);
      }
    } catch (e) {
      // Fallback 2: The LLM heavily hallucinated or formatting is broken
      console.error("Failed to parse Optimizer JSON, falling back.", e);
      parsed = {
        tips: [
          {
            id: "fallback_1",
            title: "Review Your Deductibles",
            description: "Raising your deductible can lower your monthly premium significantly. Check if you have enough in savings to cover a higher deductible.",
            category: "deductible",
            minSavings: 10,
            maxSavings: 25,
            impact: "medium",
            actionLabel: "Review Coverages",
            profileField: "null"
          }
        ],
        personalizedQuote: `Here are some generic tips for your ${insuranceType} insurance in ${location}. Let's chat more to get specific!`
      };
    }
    res.json(parsed);
  } catch (err) {
    console.error("Optimize profile error:", err);
    res.status(500).json({ error: "ai_error", message: "Failed to generate optimization tips" });
  }
});

router.post("/ai/parse-answer", async (req, res): Promise<void> => {
  const parsed = AiParseAnswerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { questionId, questionText, answer } = parsed.data;

  const prompt = `You are an AI assistant parsing answers for an insurance onboarding questionnaire.
The user was asked: "${questionText}"
The user's free-form answer was: "${answer}"

CRITICAL RULES - FILTER OUT IRRELEVANT INFORMATION:
- IGNORE any off-topic comments, personal preferences, or unrelated information (e.g., "I love pizza", "I'm hungry", "The weather is nice", etc.)
- ONLY extract information that is DIRECTLY relevant to answering the question
- If the answer contains BOTH relevant and irrelevant information, extract ONLY the relevant part
- If the answer contains ONLY irrelevant information with no answer to the question, set 'parsedValue' to null
- Examples:
  * Question: "What's your name?" Answer: "John, I love pizza" → parsedValue: "John" (ignore "I love pizza")
  * Question: "What's your name?" Answer: "I love pizza" → parsedValue: null (no name provided)
  * Question: "What's your vehicle?" Answer: "Honda Civic, I love pizza" → parsedValue: "Honda Civic" (ignore "I love pizza")
  * Question: "What's your age?" Answer: "25, I love pizza" → parsedValue: "25" (ignore "I love pizza")

Your job is to extract the core intended answer to the question (parsedValue) and any additional details (extractedEntities).
- For 'parsedValue', format it cleanly and ONLY include the answer to the question (e.g., if asked for insurance type and they said "I need coverage for my car", parsedValue is "Auto").
- IMPORTANT: If the user says "I don't know", "not sure", provides only irrelevant information, or provides an ambiguous/unhelpful answer, you MUST set 'parsedValue' to null. Do not guess or assume.
- For 'extractedEntities', include any other useful details found in their answer that are RELEVANT to insurance onboarding. You MUST use EXACTLY these keys if applicable: 'insuranceType', 'vehicleYear', 'vehicleMake', 'vehicleModel', 'budgetMonthly', 'propertyType', 'age', 'name', 'location'. (e.g. if they say "I have a 1999 tesla", extractedEntities should be {"vehicleYear": "1999", "vehicleMake": "Tesla"}).
- DO NOT include irrelevant information in extractedEntities (e.g., don't include "pizza" or "food preferences" or any non-insurance-related data).

Respond ONLY with valid JSON in this exact format:
{
  "parsedValue": "The structured answer to the question (ONLY relevant information, no off-topic comments)",
  "extractedEntities": {
    "key": "value"
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 500,
      messages: [
        { role: "system", content: "You are an expert data parser. Respond only with valid JSON." },
        { role: "user", content: prompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    let result = { parsedValue: answer, extractedEntities: {} };

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = JSON.parse(raw);
      }
    } catch (e) {
      console.error("Failed to parse AI Answer JSON, falling back.", e);
    }

    res.json(result);
  } catch (err) {
    console.error("Parse answer error:", err);
    res.status(500).json({ error: "ai_error", message: "Failed to parse answer" });
  }
});


router.post("/ai/ask-expert", async (req, res): Promise<void> => {
  const parsed = AskExpertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { query, chatHistory } = parsed.data;

  try {
    const pythonScriptPath = path.join(process.cwd(), "src", "python-workers", "moorcheh.py");

    const pythonProcess = spawn("python3", [pythonScriptPath], {
      env: {
        ...process.env,
        MOORCHEH_API_KEY: process.env.MOORCHEH_API_KEY || "",
      }
    });

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("Python worker failed:", stderrData);
        res.status(500).json({ error: "ai_error", message: "Python script error" });
        return;
      }

      try {
        const resultJSON = JSON.parse(stdoutData.trim());
        if (resultJSON.error) {
          console.error("Moorcheh Error:", resultJSON.error);
          res.status(500).json({ error: "ai_error", message: resultJSON.error });
          return;
        }

        res.json({
          answer: resultJSON.answer,
          contextCount: resultJSON.contextCount || 0
        });
      } catch (e) {
        console.error("Failed to parse python stdout:", stdoutData);
        res.status(500).json({ error: "ai_error", message: "Invalid response from python worker" });
      }
    });

    // Write the inputs to stdin
    pythonProcess.stdin.write(JSON.stringify({
      namespace: "insurewise-knowledge",
      query: query,
      chatHistory: chatHistory
    }));
    pythonProcess.stdin.end();

  } catch (err) {
    console.error("Ask expert error:", err);
    res.status(500).json({ error: "ai_error", message: "Failed to ask expert" });
  }
});

export default router;
