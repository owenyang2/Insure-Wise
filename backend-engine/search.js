const express = require('express');
const router = express.Router();
const { runFullSearch } = require('./searchOrchestrator');
const { getSession, saveSession, createNewSession } = require('./session');
const { validateProfileMiddleware } = require('./validation');
const logger = require('./logger');

// POST /api/search
router.post('/search', validateProfileMiddleware, async (req, res) => {
  const { user_profile, session_id } = req.body;
  const validationWarnings = req.validationWarnings || [];

  try {
    // Load or create session
    let session = session_id ? await getSession(session_id) : null;
    if (!session) {
      session = createNewSession(user_profile);
      logger.info('New session created', { session_id: session.session_id });
    } else {
      // Update profile with latest (may have new criteria)
      session.user_profile = user_profile;
      logger.info('Existing session loaded', { session_id, iteration: session.iteration });
    }

    // Run full pipeline
    const { ranked, warning, duration_ms, mode } = await runFullSearch(user_profile, session);

    // Cache results in session
    session.cached_results = ranked;
    await saveSession(session.session_id, session);

    // Build response
    const response = {
      session_id: session.session_id,
      iteration: session.iteration,
      mode,
      plan_count: ranked.length,
      plans: ranked.map(formatPlanForResponse),
      warning: warning || null,
      validation_warnings: validationWarnings.length ? validationWarnings : undefined,
      meta: {
        duration_ms,
        criteria_used: {
          coverage_needs: user_profile.coverage_needs,
          priority_weights: user_profile.priority_weights,
          budget_max: user_profile.budget_max || null
        }
      }
    };

    logger.info('Search complete', {
      session_id: session.session_id,
      plan_count: ranked.length,
      duration_ms
    });

    res.json(response);

  } catch (err) {
    logger.error('Search failed', { error: err.message, stack: err.stack });
    res.status(500).json({
      error: 'Search failed',
      message: err.message,
      fallback: 'Try again or contact support'
    });
  }
});

// POST /api/explain
// Called when user clicks a specific plan to see full policy detail
router.post('/explain', async (req, res) => {
  const { session_id, plan_id } = req.body;

  if (!session_id || !plan_id) {
    return res.status(400).json({ error: 'session_id and plan_id required' });
  }

  try {
    const session = await getSession(session_id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const plan = session.cached_results?.find(p => p.plan_id === plan_id);
    if (!plan) return res.status(404).json({ error: 'Plan not found in session' });

    const { explainPolicy } = require('./searchOrchestrator');
    const explanation = await explainPolicy(session.user_profile, plan);

    res.json({
      session_id,
      plan_id,
      carrier_name: plan.carrier_name,
      monthly_price: plan.monthly_price,
      coverage_explanation: explanation,
      gap_flags: plan.gap_flags,
      risk_warnings: plan.risk_warnings,
      apply_url: plan.apply_url
    });

  } catch (err) {
    logger.error('Explain failed', { error: err.message });
    res.status(500).json({ error: 'Explanation failed', message: err.message });
  }
});

function formatPlanForResponse(plan) {
  return {
    rank: plan.rank,
    carrier_id: plan.carrier_id,
    carrier_name: plan.carrier_name,
    monthly_price: plan.monthly_price,
    final_score: Math.round(plan.final_score * 100) / 100,
    score_breakdown: plan.score_breakdown,
    covered: plan.covered || [],
    excluded: plan.excluded || [],
    gap_flags: plan.gap_flags || [],
    risk_warnings: plan.risk_warnings || [],
    deductible: plan.deductible,
    rating: plan.rating,
    apply_url: plan.apply_url,
    ai_explanation: plan.ai_explanation,
    has_policy_detail: plan.has_policy_detail || false,
    last_pdf_updated: plan.last_pdf_updated
  };
}

module.exports = router;
