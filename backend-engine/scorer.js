// Pure scoring logic — no AI, no API calls.
// Takes enriched + Watsonx-scored plans and applies priority weights.

function computePriceScore(price, allPrices) {
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  if (max === min) return 1.0;
  return 1 - (price - min) / (max - min);
}

function computeRatingScore(rating) {
  // Normalise 3.0–5.0 range to 0.0–1.0
  return Math.max(0, Math.min(1, (rating - 3.0) / 2.0));
}

function computeGapPenalty(coverageScore, watsonxGapFlags) {
  // Each gap reduces the score
  const gapCount = (watsonxGapFlags || []).length;
  return gapCount * 0.12;
}

function computeFinalScore(plan, weights) {
  const { coverage_score, price_score, rating_score, gap_penalty } = plan._scores;
  const w = weights;

  const raw = (coverage_score  * w.coverage  / 100)
            + (price_score     * w.price     / 100)
            + (rating_score    * w.rating    / 100)
            - (gap_penalty     * w.gap_penalty / 100);

  return Math.max(0, Math.min(1, raw));
}

// Apply scores to all plans given shared context (all prices needed for normalisation)
function scoreAllPlans(enrichedPlans, watsonxScores, weights) {
  const allPrices = enrichedPlans.map(p => p.monthly_price);

  return enrichedPlans.map(plan => {
    // Find matching Watsonx score result
    const wxScore = watsonxScores.find(s => s._plan_id === plan.plan_id) || {};

    const coverage_score  = parseFloat(wxScore.coverage_score || 0.5);
    const price_score     = computePriceScore(plan.monthly_price, allPrices);
    const rating_score    = computeRatingScore(plan.rating || 4.0);
    const gap_penalty     = computeGapPenalty(coverage_score, wxScore.gap_flags);

    plan._scores = { coverage_score, price_score, rating_score, gap_penalty };

    return {
      ...plan,
      coverage_score,
      final_score: computeFinalScore(plan, weights),
      score_breakdown: {
        coverage_score: round(coverage_score),
        price_score: round(price_score),
        rating_score: round(rating_score),
        gap_penalty: round(gap_penalty)
      },
      gap_flags: wxScore.gap_flags || [],
      risk_warnings: wxScore.risk_warnings || [],
      ai_explanation: wxScore.explanation || ''
    };
  });
}

// Sort and filter ranked plans
function rankPlans(scoredPlans, rejectedPlanIds = [], maxDeductible = null) {
  return scoredPlans
    .filter(p => !rejectedPlanIds.includes(p.plan_id))
    .filter(p => !maxDeductible || p.deductible <= maxDeductible)
    .sort((a, b) => b.final_score - a.final_score)
    .map((plan, idx) => ({ ...plan, rank: idx + 1 }));
}

// Re-rank cached results with new weights — no API call needed
function rerankCached(cachedPlans, newWeights, rejectedPlanIds = []) {
  const allPrices = cachedPlans.map(p => p.monthly_price);

  const rescored = cachedPlans.map(plan => {
    // Recompute price_score (other scores don't change)
    const price_score = computePriceScore(plan.monthly_price, allPrices);
    plan._scores = {
      ...plan._scores,
      price_score
    };

    return {
      ...plan,
      final_score: computeFinalScore(plan, newWeights),
      score_breakdown: {
        coverage_score: round(plan._scores.coverage_score),
        price_score: round(price_score),
        rating_score: round(plan._scores.rating_score),
        gap_penalty: round(plan._scores.gap_penalty)
      }
    };
  });

  return rankPlans(rescored, rejectedPlanIds);
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { scoreAllPlans, rankPlans, rerankCached };
