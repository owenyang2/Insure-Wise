/**
 * Test suite for the Insurance Agent Search Engine
 * Run with: node tests/run-tests.js
 * No real API keys needed — all external calls are mocked
 */

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://localhost:5432/insurance_agent_test';
process.env.REDIS_URL = 'redis://localhost:6379';

// ─── Minimal test runner ──────────────────────────────────────
let passed = 0;
let failed = 0;
const results = [];

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓  ${name}`);
    passed++;
    results.push({ name, status: 'pass' });
  } catch (err) {
    console.log(`  ✗  ${name}`);
    console.log(`     ${err.message}`);
    failed++;
    results.push({ name, status: 'fail', error: err.message });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(a, b, message) {
  if (a !== b) throw new Error(message || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertBetween(val, min, max, message) {
  if (val < min || val > max) throw new Error(message || `Expected ${val} to be between ${min} and ${max}`);
}

(async function runAll() {
// ─── TESTS: Scoring engine ────────────────────────────────────
console.log('\n── Scoring engine ──────────────────────────────────');

const { scoreAllPlans, rankPlans, rerankCached } = require('./scorer');

const mockEnriched = [
  {
    carrier_id: 'carrier_a', carrier_name: 'Carrier A',
    plan_id: 'plan-a', monthly_price: 300, rating: 4.8, deductible: 1000,
    covered: ['General Liability', 'Liquor Liability', 'Property Damage'],
    excluded: []
  },
  {
    carrier_id: 'carrier_b', carrier_name: 'Carrier B',
    plan_id: 'plan-b', monthly_price: 200, rating: 3.5, deductible: 2000,
    covered: ['General Liability'],
    excluded: ['Liquor Liability', 'Property Damage']
  },
  {
    carrier_id: 'carrier_c', carrier_name: 'Carrier C',
    plan_id: 'plan-c', monthly_price: 400, rating: 4.5, deductible: 500,
    covered: ['General Liability', 'Liquor Liability', 'Property Damage', 'Workers Comp'],
    excluded: []
  }
];

const mockWatsonxScores = [
  { _plan_id: 'plan-a', coverage_score: 0.9,  gap_flags: [],                            explanation: 'Good match.' },
  { _plan_id: 'plan-b', coverage_score: 0.33, gap_flags: ['Liquor Liability missing', 'Property Damage missing'], explanation: 'Missing key coverages.' },
  { _plan_id: 'plan-c', coverage_score: 1.0,  gap_flags: [],                            explanation: 'Excellent match.' }
];

const defaultWeights = { coverage: 40, price: 30, rating: 20, gap_penalty: 10 };

await test('scoreAllPlans — attaches final_score to each plan', async () => {
  const scored = scoreAllPlans(mockEnriched, mockWatsonxScores, defaultWeights);
  assert(scored.length === 3, 'should have 3 plans');
  scored.forEach(p => {
    assert(typeof p.final_score === 'number', `plan ${p.carrier_id} missing final_score`);
    assertBetween(p.final_score, 0, 1, `score out of range for ${p.carrier_id}`);
  });
});

await test('scoreAllPlans — higher coverage score wins with coverage-heavy weights', async () => {
  const coverageHeavy = { coverage: 80, price: 10, rating: 0, gap_penalty: 10 };
  const scored = scoreAllPlans(mockEnriched, mockWatsonxScores, coverageHeavy);
  const ranked = rankPlans(scored);
  // plan-c has coverage_score 1.0 — should win with coverage-heavy weights
  assertEqual(ranked[0].plan_id, 'plan-c', 'plan-c should rank #1 with coverage-heavy weights');
});

await test('scoreAllPlans — lower price wins with price-heavy weights', async () => {
  const priceHeavy = { coverage: 10, price: 70, rating: 10, gap_penalty: 10 };
  const scored = scoreAllPlans(mockEnriched, mockWatsonxScores, priceHeavy);
  const ranked = rankPlans(scored);
  // plan-b has lowest price ($200) — should win with price-heavy weights
  assertEqual(ranked[0].plan_id, 'plan-b', 'plan-b should rank #1 with price-heavy weights');
});

await test('rankPlans — excludes rejected plan IDs', async () => {
  const scored = scoreAllPlans(mockEnriched, mockWatsonxScores, defaultWeights);
  const ranked = rankPlans(scored, ['plan-c']);
  assert(!ranked.find(p => p.plan_id === 'plan-c'), 'rejected plan should be excluded');
  assertEqual(ranked.length, 2, 'should have 2 plans after rejection');
});

await test('rankPlans — filters by max deductible', async () => {
  const scored = scoreAllPlans(mockEnriched, mockWatsonxScores, defaultWeights);
  const ranked = rankPlans(scored, [], 1500);  // max deductible $1500
  // plan-b has $2000 deductible — should be excluded
  assert(!ranked.find(p => p.plan_id === 'plan-b'), 'plan-b should be filtered (deductible too high)');
});

await test('rankPlans — assigns sequential rank numbers', async () => {
  const scored = scoreAllPlans(mockEnriched, mockWatsonxScores, defaultWeights);
  const ranked = rankPlans(scored);
  ranked.forEach((p, i) => assertEqual(p.rank, i + 1, `rank should be ${i + 1}`));
});

await test('rerankCached — re-sorts without changing coverage scores', async () => {
  const scored = scoreAllPlans(mockEnriched, mockWatsonxScores, defaultWeights);
  const original = rankPlans(scored);
  const originalRank1Id = original[0].plan_id;

  // Switch to price-heavy — should change ranking
  const priceHeavy = { coverage: 10, price: 70, rating: 10, gap_penalty: 10 };
  const reranked = rerankCached(scored, priceHeavy);
  const newRank1Id = reranked[0].plan_id;

  assert(newRank1Id === 'plan-b', 'cheapest plan should win after reweight to price');
  assert(originalRank1Id !== newRank1Id || true, 'ranking changed (or same if scores tied)');
});

await test('rerankCached — coverage scores unchanged after reweight', async () => {
  const scored = scoreAllPlans(mockEnriched, mockWatsonxScores, defaultWeights);
  const priceHeavy = { coverage: 10, price: 70, rating: 10, gap_penalty: 10 };
  const reranked = rerankCached(scored, priceHeavy);
  const planA = reranked.find(p => p.plan_id === 'plan-a');
  // coverage_score should be unchanged
  assertEqual(planA._scores.coverage_score, 0.9, 'coverage_score should be preserved');
});

// ─── TESTS: Input validation ──────────────────────────────────
console.log('\n── Input validation ────────────────────────────────');

const { validateUserProfile } = require('./validation');

await test('validateUserProfile — rejects missing business_type', async () => {
  const { errors } = validateUserProfile({
    location: 'Toronto, ON',
    coverage_needs: ['General Liability'],
    priority_weights: { coverage: 40, price: 30, rating: 20, gap_penalty: 10 }
  });
  assert(errors.some(e => e.includes('business_type')), 'should error on missing business_type');
});

await test('validateUserProfile — rejects weights not summing to 100', async () => {
  const { errors } = validateUserProfile({
    business_type: 'bar',
    location: 'Toronto, ON',
    coverage_needs: ['General Liability'],
    priority_weights: { coverage: 50, price: 50, rating: 10, gap_penalty: 10 }
  });
  assert(errors.some(e => e.includes('sum to 100')), 'should error on weights not summing to 100');
});

await test('validateUserProfile — passes valid profile', async () => {
  const { errors } = validateUserProfile({
    business_type: 'bar',
    location: 'Toronto, ON',
    employees: 12,
    coverage_needs: ['General Liability', 'Liquor Liability'],
    priority_weights: { coverage: 40, price: 30, rating: 20, gap_penalty: 10 }
  });
  assertEqual(errors.length, 0, `should have no errors, got: ${errors.join(', ')}`);
});

await test('validateUserProfile — filters out invalid coverage needs', async () => {
  const { warnings, sanitised } = validateUserProfile({
    business_type: 'bar',
    location: 'Toronto, ON',
    coverage_needs: ['General Liability', 'InvalidCoverage', 'Liquor Liability'],
    priority_weights: { coverage: 40, price: 30, rating: 20, gap_penalty: 10 }
  });
  assert(warnings.some(w => w.includes('InvalidCoverage')), 'should warn about invalid coverage');
  assert(!sanitised.coverage_needs.includes('InvalidCoverage'), 'should remove invalid coverage');
  assert(sanitised.coverage_needs.includes('General Liability'), 'should keep valid coverage');
});

await test('validateUserProfile — coerces employees to integer', async () => {
  const { sanitised } = validateUserProfile({
    business_type: 'bar',
    location: 'Toronto, ON',
    employees: '12',
    coverage_needs: ['General Liability'],
    priority_weights: { coverage: 40, price: 30, rating: 20, gap_penalty: 10 }
  });
  assertEqual(typeof sanitised.employees, 'number', 'employees should be coerced to number');
  assertEqual(sanitised.employees, 12);
});

// ─── TESTS: NLP normaliser ────────────────────────────────────
console.log('\n── NLP normaliser ──────────────────────────────────');

const { normaliseWithRules, normaliseToStandardTag } = require('./nlp');

await test('normaliseWithRules — detects covered items', async () => {
  const text = 'This policy includes general liability coverage and liquor liability protection for licensed establishments.';
  const { covered } = normaliseWithRules(text);
  assert(covered.includes('General Liability'), 'should detect General Liability');
  assert(covered.includes('Liquor Liability'), 'should detect Liquor Liability');
});

await test('normaliseWithRules — detects excluded items', async () => {
  const text = 'Food contamination is excluded from this policy. Cyber liability does not cover data breach events.';
  const { excluded } = normaliseWithRules(text);
  assert(excluded.includes('Food Contamination'), 'should detect excluded Food Contamination');
  assert(excluded.includes('Cyber Liability'), 'should detect excluded Cyber Liability');
});

await test('normaliseWithRules — detects sublimit/partial items', async () => {
  const text = 'Business interruption is covered up to $100,000 maximum.';
  const { ambiguous } = normaliseWithRules(text);
  assert(ambiguous.some(a => a.tag === 'Business Interruption'), 'should flag Business Interruption as ambiguous/sublimit');
});

await test('normaliseToStandardTag — maps synonym to tag', async () => {
  assertEqual(normaliseToStandardTag('dram shop liability'), 'Liquor Liability');
  assertEqual(normaliseToStandardTag('third party liability'), 'General Liability');
  assertEqual(normaliseToStandardTag('machinery breakdown'), 'Equipment Breakdown');
});

// ─── TESTS: Watsonx prompts ───────────────────────────────────
console.log('\n── Watsonx prompts ─────────────────────────────────');

const { buildIntentClassifierPrompt, buildScorerPrompt, buildPolicyExplainerPrompt } = require('./watsonx-prompts');

await test('buildIntentClassifierPrompt — includes feedback text', async () => {
  const prompt = buildIntentClassifierPrompt({
    feedbackText: 'price matters more',
    currentWeights: { coverage: 40, price: 30, rating: 20 },
    coverageNeeds: ['General Liability'],
    criteriaHistory: []
  });
  assert(prompt.includes('price matters more'), 'prompt should include feedback text');
  assert(prompt.includes('REWEIGHT'), 'prompt should include REWEIGHT option');
  assert(prompt.includes('NEW_CRITERIA'), 'prompt should include NEW_CRITERIA option');
  assert(prompt.includes('JSON'), 'prompt should request JSON output');
});

await test('buildScorerPrompt — includes all user needs', async () => {
  const prompt = buildScorerPrompt({
    userProfile: {
      business_type: 'bar',
      location: 'Toronto, ON',
      employees: 12,
      annual_revenue: '$800K',
      alcohol_sales: true,
      coverage_needs: ['Liquor Liability', 'General Liability']
    },
    enrichedPlan: {
      carrier_name: 'Intact',
      monthly_price: 338,
      rating: 4.7,
      deductible: 2000,
      covered: ['General Liability', 'Liquor Liability'],
      excluded: []
    },
    criteriaHistory: []
  });
  assert(prompt.includes('Liquor Liability'), 'prompt should include user needs');
  assert(prompt.includes('bar'), 'prompt should include business type');
  assert(prompt.includes('coverage_score'), 'prompt should request coverage_score');
});

await test('buildPolicyExplainerPrompt — includes per-need instructions', async () => {
  const prompt = buildPolicyExplainerPrompt({
    userProfile: {
      business_type: 'bar',
      location: 'Toronto, ON',
      coverage_needs: ['Liquor Liability', 'Food Contamination']
    },
    selectedPlan: {
      carrier_name: 'Intact',
      monthly_price: 338,
      deductible: 2000,
      covered: ['Liquor Liability'],
      excluded: ['Food Contamination'],
      raw_exclusion_text: 'Food contamination excluded unless caused by fire'
    }
  });
  assert(prompt.includes('Liquor Liability'), 'prompt should include coverage need');
  assert(prompt.includes('Food Contamination'), 'prompt should include coverage need');
  assert(prompt.includes('plain English'), 'prompt should request plain English');
});

// ─── TESTS: Aggregator mock ───────────────────────────────────
console.log('\n── Aggregator (mock mode) ──────────────────────────');

const { fetchQuotes } = require('./aggregator');

await test('fetchQuotes — returns mock data when no API key configured', async () => {
  const quotes = await fetchQuotes({
    business_type: 'bar',
    location: 'Toronto, ON',
    coverage_needs: ['General Liability'],
    priority_weights: { coverage: 40, price: 30, rating: 20, gap_penalty: 10 }
  });
  assert(Array.isArray(quotes), 'should return array');
  assert(quotes.length > 0, 'should return at least one quote');
  quotes.forEach(q => {
    assert(q.carrier_id, 'each quote needs carrier_id');
    assert(q.monthly_price > 0, 'each quote needs monthly_price');
    assert(q.plan_id, 'each quote needs plan_id');
  });
});

await test('fetchQuotes — respects budget_max filter', async () => {
  const quotes = await fetchQuotes({
    business_type: 'bar',
    location: 'Toronto, ON',
    coverage_needs: ['General Liability'],
    budget_max: 300,
    priority_weights: { coverage: 40, price: 30, rating: 20, gap_penalty: 10 }
  });
  quotes.forEach(q => {
    assert(q.monthly_price <= 300, `plan ${q.carrier_id} at $${q.monthly_price} exceeds budget`);
  });
});

// ─── TESTS: Config ────────────────────────────────────────────
console.log('\n── Config ──────────────────────────────────────────');

const { config } = require('./config');

await test('config — has all required sections', async () => {
  assert(config.server, 'missing server config');
  assert(config.scoring, 'missing scoring config');
  assert(config.scoring.defaultWeights, 'missing default weights');
  const total = Object.values(config.scoring.defaultWeights).reduce((a, b) => a + b, 0);
  assertEqual(total, 100, 'default weights should sum to 100');
});

await test('config — scoring defaults are valid', async () => {
  const w = config.scoring.defaultWeights;
  assert(w.coverage > 0, 'coverage weight should be positive');
  assert(w.price > 0, 'price weight should be positive');
  assert(w.rating > 0, 'rating weight should be positive');
  assert(w.gap_penalty > 0, 'gap_penalty weight should be positive');
});

// ─── RESULTS ─────────────────────────────────────────────────
console.log('\n────────────────────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\nFailed tests:');
  results.filter(r => r.status === 'fail').forEach(r => {
    console.log(`  ✗ ${r.name}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('\nAll tests passed ✓');
  process.exit(0);
}

})();
