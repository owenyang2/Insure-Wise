const express = require('express');
const router = express.Router();
const { classifyIntent, applyIntentToSession, runFullSearch } = require('./searchOrchestrator');
const { rerankCached } = require('./scorer');
const { getSession, saveSession } = require('./session');
const { validateFeedbackMiddleware } = require('./validation');
const logger = require('./logger');

// POST /api/feedback
router.post('/feedback', validateFeedbackMiddleware, async (req, res) => {
  const { session_id, feedback_text } = req.body;

  if (!session_id || !feedback_text?.trim()) {
    return res.status(400).json({ error: 'session_id and feedback_text required' });
  }

  const session = await getSession(session_id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found — start a new search' });
  }

  try {
    // Step 1: Classify the intent
    const intent = await classifyIntent(feedback_text, session);
    logger.info('Intent classified', { session_id, intent: intent.intent, feedback_text });

    // Handle AMBIGUOUS — ask clarifying question
    if (intent.intent === 'AMBIGUOUS') {
      return res.json({
        session_id,
        mode: 'clarify',
        clarifying_question: intent.clarifying_question,
        plans: null
      });
    }

    // Step 2: Apply intent to session state
    const updatedSession = applyIntentToSession(intent, session);

    // Step 3a: REWEIGHT — re-sort cached results, no API call
    if (intent.intent === 'REWEIGHT') {
      const startTime = Date.now();

      const reranked = rerankCached(
        updatedSession.cached_results,
        updatedSession.user_profile.priority_weights,
        updatedSession.rejected_plan_ids
      );

      updatedSession.cached_results = reranked;
      await saveSession(session_id, updatedSession);

      logger.info('Re-ranked in memory', { session_id, duration_ms: Date.now() - startTime });

      return res.json({
        session_id,
        iteration: updatedSession.iteration,
        mode: 'rerank',
        new_weights: updatedSession.user_profile.priority_weights,
        plan_count: reranked.length,
        plans: reranked.map(formatPlanForResponse),
        duration_ms: Date.now() - startTime
      });
    }

    // Step 3b: NEW_CRITERIA — full new search
    if (intent.intent === 'NEW_CRITERIA') {
      const { ranked, warning, duration_ms } = await runFullSearch(
        updatedSession.user_profile,
        updatedSession
      );

      updatedSession.cached_results = ranked;
      await saveSession(session_id, updatedSession);

      return res.json({
        session_id,
        iteration: updatedSession.iteration,
        mode: 'new_search',
        new_criteria: intent.new_criteria || [],
        plan_count: ranked.length,
        plans: ranked.map(formatPlanForResponse),
        warning: warning || null,
        duration_ms
      });
    }

  } catch (err) {
    logger.error('Feedback processing failed', { error: err.message, session_id });
    res.status(500).json({ error: 'Feedback processing failed', message: err.message });
  }
});

// POST /api/feedback/reject
// User dismisses a plan — remove from results permanently for this session
router.post('/feedback/reject', async (req, res) => {
  const { session_id, plan_id } = req.body;
  if (!session_id || !plan_id) {
    return res.status(400).json({ error: 'session_id and plan_id required' });
  }

  const session = await getSession(session_id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  if (!session.rejected_plan_ids.includes(plan_id)) {
    session.rejected_plan_ids.push(plan_id);
  }

  // Remove from cached results and re-rank
  session.cached_results = session.cached_results
    .filter(p => p.plan_id !== plan_id)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  await saveSession(session_id, session);

  res.json({
    session_id,
    rejected_plan_id: plan_id,
    plans: session.cached_results.map(formatPlanForResponse)
  });
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
    has_policy_detail: plan.has_policy_detail || false
  };
}

module.exports = router;
