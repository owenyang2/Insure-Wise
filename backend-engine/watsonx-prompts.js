// ─── PROMPT 1: Intent Classifier ─────────────────────────────
// Runs on every user feedback. Returns REWEIGHT | NEW_CRITERIA | AMBIGUOUS

function buildIntentClassifierPrompt({ feedbackText, currentWeights, coverageNeeds, criteriaHistory }) {
  return `You are classifying user intent for an insurance search engine.

User said: "${feedbackText}"
Current priority weights: coverage=${currentWeights.coverage}% price=${currentWeights.price}% rating=${currentWeights.rating}%
Current coverage needs: ${coverageNeeds.join(', ')}
Criteria history: ${JSON.stringify(criteriaHistory.map(h => ({ iteration: h.iteration, needs: h.needs })))}

Classify as exactly one of:
- REWEIGHT: user wants to change how existing results are sorted (e.g. "price matters more", "sort by cheapest", "rating is most important")
- NEW_CRITERIA: user is adding a new requirement that means existing results may not qualify (e.g. "I also need flood coverage", "under $300/month", "max deductible $1000", "add cyber liability")
- AMBIGUOUS: cannot determine which without clarification

Rules:
- If the feedback only adjusts importance/weight of existing dimensions → REWEIGHT
- If the feedback adds a new coverage type, sets a hard budget, or changes eligibility criteria → NEW_CRITERIA
- If genuinely unclear → AMBIGUOUS

Respond with valid JSON only. No prose. No markdown.
{
  "intent": "REWEIGHT" | "NEW_CRITERIA" | "AMBIGUOUS",
  "new_weights": { "coverage": 0, "price": 0, "rating": 0 },
  "new_criteria": [],
  "new_budget_max": null,
  "new_max_deductible": null,
  "clarifying_question": ""
}

For REWEIGHT: fill new_weights (must sum to 90, gap_penalty is fixed at 10).
For NEW_CRITERIA: fill new_criteria list and/or new_budget_max or new_max_deductible.
For AMBIGUOUS: fill clarifying_question only.`;
}


// ─── PROMPT 2: Risk + Gap Scorer ─────────────────────────────
// Runs per enriched plan (parallel). Returns coverage_score, gaps, explanation.

function buildScorerPrompt({ userProfile, enrichedPlan, criteriaHistory }) {
  const allNeeds = [
    ...new Set([
      ...userProfile.coverage_needs,
      ...(criteriaHistory.flatMap(h => h.needs || []))
    ])
  ];

  return `You are scoring an insurance plan against a business owner's needs.

Business profile:
- Type: ${userProfile.business_type}
- Location: ${userProfile.location}
- Employees: ${userProfile.employees}
- Annual revenue: ${userProfile.annual_revenue}
- Alcohol sales: ${userProfile.alcohol_sales}

User's required coverage: ${allNeeds.join(', ')}
Search iteration: ${userProfile.iteration || 1}
Previous criteria tried: ${JSON.stringify(criteriaHistory.map(h => h.needs))}

Insurance plan to score:
- Carrier: ${enrichedPlan.carrier_name}
- Monthly price: $${enrichedPlan.monthly_price}
- Covered: ${(enrichedPlan.covered || []).join(', ') || 'unknown'}
- Excluded: ${(enrichedPlan.excluded || []).join(', ') || 'unknown'}
- Liability limit: ${enrichedPlan.liability_limit || 'not specified'}
- Deductible: $${enrichedPlan.deductible}
- Insurer rating: ${enrichedPlan.rating}/5

Tasks:
1. Score coverage_match 0.0–1.0 based on how many of the user's required coverages this plan includes
2. List gap_flags — each required coverage that is NOT covered or is covered_with_limit
3. List risk_warnings specific to this business type (e.g. "Liquor liability limit too low for a bar with primary alcohol sales")
4. Write a 2-sentence plain-language explanation of this plan's fit

Respond with valid JSON only. No prose. No markdown.
{
  "coverage_score": 0.0,
  "gap_flags": [],
  "risk_warnings": [],
  "explanation": ""
}`;
}


// ─── PROMPT 3: Policy Explainer ───────────────────────────────
// Runs when user selects a specific plan. Returns per-need explanation.

function buildPolicyExplainerPrompt({ userProfile, selectedPlan }) {
  return `You are explaining an insurance policy to a business owner in plain English.

The business owner is a ${userProfile.business_type} in ${userProfile.location}.
They specifically asked for coverage of: ${userProfile.coverage_needs.join(', ')}

Policy details:
- Carrier: ${selectedPlan.carrier_name}
- Monthly price: $${selectedPlan.monthly_price}
- Covered events: ${(selectedPlan.covered || []).join(', ')}
- Excluded events: ${(selectedPlan.excluded || []).join(', ')}
- Deductible: $${selectedPlan.deductible}
- Key exclusion clause: "${selectedPlan.raw_exclusion_text || 'not available'}"

For EACH item the user asked for, write exactly one sentence saying:
- COVERED: what is covered and the limit
- PARTIAL: what is covered but with important limitations
- NOT COVERED: that it is not covered, and if possible quote the relevant clause in under 12 words

Use plain English. No insurance jargon. No bullet points in explanations.

Respond with valid JSON array only. No prose. No markdown.
[
  {
    "need": "coverage name",
    "status": "covered" | "partial" | "not_covered",
    "explanation": "one plain-English sentence"
  }
]`;
}

module.exports = { buildIntentClassifierPrompt, buildScorerPrompt, buildPolicyExplainerPrompt };
