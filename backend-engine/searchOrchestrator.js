const { fetchQuotes } = require('./aggregator');
const { getPoliciesByCarrierIds } = require('./client');
const { watsonxGenerate, watsonxBatch } = require('./watsonx');
const { scoreAllPlans, rankPlans, rerankCached } = require('./scorer');
const { buildScorerPrompt, buildIntentClassifierPrompt, buildPolicyExplainerPrompt } = require('./watsonx-prompts');
const logger = require('./logger');

// ─── STEP A + B: Fetch quotes and enrich with policy DB ────────
async function fetchAndEnrich(userProfile) {
  // Step A: get real-time quotes from aggregator
  logger.info('Step A: Fetching quotes from aggregator');
  const quotes = await fetchQuotes(userProfile);
  logger.info(`Got ${quotes.length} quotes`);

  // Hard filter: budget ceiling
  const filtered = userProfile.budget_max
    ? quotes.filter(q => q.monthly_price <= userProfile.budget_max)
    : quotes;

  if (filtered.length === 0) {
    return { plans: [], warning: 'No plans found within budget. Try increasing budget_max.' };
  }

  // Step B: join with policy DB (WDU-extracted data)
  logger.info('Step B: Enriching with policy DB');
  const carrierIds = filtered.map(q => q.carrier_id);
  const policyMap = await getPoliciesByCarrierIds(carrierIds);

  const enriched = filtered.map(quote => {
    const policy = policyMap[quote.carrier_id] || {};
    return {
      ...quote,
      covered: policy.covered || [],
      excluded: policy.excluded || [],
      liability_limit: policy.liability_limit || null,
      deductible_min: policy.deductible_min || null,
      deductible_max: policy.deductible_max || null,
      waiting_period: policy.waiting_period || null,
      claim_process: policy.claim_process || null,
      raw_exclusion_text: policy.raw_exclusion_text || null,
      last_pdf_updated: policy.last_updated || null,
      has_policy_detail: Object.keys(policy).length > 0
    };
  });

  return { plans: enriched, warning: null };
}

// ─── STEP C: Score all plans with Watsonx (parallel) ──────────
async function scoreWithWatsonx(enrichedPlans, userProfile, criteriaHistory) {
  logger.info(`Step C: Scoring ${enrichedPlans.length} plans with Watsonx`);

  const prompts = enrichedPlans.map(plan => ({
    planId: plan.plan_id,
    prompt: buildScorerPrompt({ userProfile, enrichedPlan: plan, criteriaHistory }),
    options: { maxTokens: 400 }
  }));

  const results = await watsonxBatch(prompts);

  // Extract successful scores, use defaults for failed ones
  return results.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      logger.error(`Watsonx scoring failed for plan ${enrichedPlans[idx].plan_id}`, {
        error: result.reason?.message
      });
      // Default score on failure — plan stays in results, flagged
      return {
        _plan_id: enrichedPlans[idx].plan_id,
        coverage_score: 0.5,
        gap_flags: ['Score unavailable — review manually'],
        risk_warnings: [],
        explanation: 'Automated scoring temporarily unavailable for this plan.'
      };
    }
  });
}

// ─── FULL PIPELINE: New search ────────────────────────────────
async function runFullSearch(userProfile, session) {
  const startTime = Date.now();

  // Steps A + B
  const { plans: enriched, warning } = await fetchAndEnrich(userProfile);
  if (enriched.length === 0) {
    return { ranked: [], warning, duration_ms: Date.now() - startTime };
  }

  // Step C
  const watsonxScores = await scoreWithWatsonx(enriched, userProfile, session.criteria_history);

  // Apply scoring formula
  const scored = scoreAllPlans(enriched, watsonxScores, userProfile.priority_weights);

  // Step D: rank and filter
  const ranked = rankPlans(scored, session.rejected_plan_ids, userProfile.max_deductible);

  logger.info(`Full search complete in ${Date.now() - startTime}ms — ${ranked.length} plans ranked`);

  return {
    ranked,
    warning,
    duration_ms: Date.now() - startTime,
    mode: 'new_search'
  };
}

// ─── INTENT CLASSIFIER ────────────────────────────────────────
async function classifyIntent(feedbackText, session) {
  logger.info('Classifying user intent');

  const prompt = buildIntentClassifierPrompt({
    feedbackText,
    currentWeights: session.user_profile.priority_weights,
    coverageNeeds: session.user_profile.coverage_needs,
    criteriaHistory: session.criteria_history
  });

  try {
    return await watsonxGenerate(prompt, { maxTokens: 200 });
  } catch (err) {
    logger.error('Intent classifier failed — defaulting to NEW_CRITERIA', { error: err.message });
    // Safer default: trigger a new search rather than stale re-rank
    return {
      intent: 'NEW_CRITERIA',
      new_criteria: [],
      clarifying_question: null
    };
  }
}

// ─── APPLY INTENT TO SESSION ──────────────────────────────────
function applyIntentToSession(intent, session) {
  const profile = { ...session.user_profile };

  if (intent.intent === 'REWEIGHT' && intent.new_weights) {
    profile.priority_weights = {
      coverage: intent.new_weights.coverage,
      price: intent.new_weights.price,
      rating: intent.new_weights.rating,
      gap_penalty: 10  // always fixed
    };
  }

  if (intent.intent === 'NEW_CRITERIA') {
    // Add new coverage needs
    if (intent.new_criteria?.length > 0) {
      const existing = new Set(profile.coverage_needs);
      intent.new_criteria.forEach(c => existing.add(c));
      profile.coverage_needs = [...existing];
    }
    // Update budget ceiling
    if (intent.new_budget_max) {
      profile.budget_max = intent.new_budget_max;
    }
    // Update max deductible
    if (intent.new_max_deductible) {
      profile.max_deductible = intent.new_max_deductible;
    }
    // Increment iteration
    session.iteration += 1;
    profile.iteration = session.iteration;
    session.criteria_history.push({
      iteration: session.iteration,
      needs: profile.coverage_needs,
      weights: profile.priority_weights,
      budget_max: profile.budget_max,
      timestamp: new Date().toISOString()
    });
  }

  session.user_profile = profile;
  return session;
}

// ─── POLICY EXPLAINER (on plan select) ────────────────────────
async function explainPolicy(userProfile, selectedPlan) {
  logger.info(`Explaining policy for ${selectedPlan.carrier_name}`);

  const prompt = buildPolicyExplainerPrompt({ userProfile, selectedPlan });

  try {
    return await watsonxGenerate(prompt, { maxTokens: 800 });
  } catch (err) {
    logger.error('Policy explainer failed', { error: err.message });
    return userProfile.coverage_needs.map(need => ({
      need,
      status: selectedPlan.covered?.includes(need) ? 'covered' : 'not_covered',
      explanation: 'Explanation temporarily unavailable — check policy document directly.'
    }));
  }
}

module.exports = { runFullSearch, classifyIntent, applyIntentToSession, explainPolicy, rerankCached };
