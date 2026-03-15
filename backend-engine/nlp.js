const axios = require('axios');
const logger = require('./logger');

let nlpToken = null;
let nlpTokenExpiry = 0;

async function getNlpToken() {
  if (nlpToken && Date.now() < nlpTokenExpiry) return nlpToken;
  const resp = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: process.env.IBM_NLP_API_KEY
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  nlpToken = resp.data.access_token;
  nlpTokenExpiry = Date.now() + (resp.data.expires_in - 60) * 1000;
  return nlpToken;
}

// Standard coverage tags — every carrier maps to these
const STANDARD_TAGS = {
  'General Liability':      ['general liability', 'third party liability', 'bodily injury liability', 'premises liability'],
  'Liquor Liability':       ['liquor liability', 'host liquor', 'dram shop', 'alcohol liability', 'liquor legal'],
  'Property Damage':        ['property damage', 'building coverage', 'contents coverage', 'commercial property'],
  'Food Contamination':     ['food contamination', 'product liability', 'food spoilage', 'contamination coverage'],
  'Workers Comp':           ["workers' compensation", 'workers compensation', 'employee injury', 'occupational accident'],
  'Cyber Liability':        ['cyber liability', 'data breach', 'cyber incident', 'network security', 'privacy liability'],
  'Business Interruption':  ['business interruption', 'loss of income', 'business income', 'extra expense coverage'],
  'Equipment Breakdown':    ['equipment breakdown', 'machinery breakdown', 'mechanical breakdown', 'boiler and machinery'],
};

// Use IBM NLP to extract entities from policy text
async function extractEntitiesWithNlp(text) {
  if (!process.env.IBM_NLP_API_KEY || process.env.IBM_NLP_API_KEY === 'your_ibm_nlp_key_here') {
    return normaliseWithRules(text);
  }

  try {
    const token = await getNlpToken();
    const resp = await axios.post(
      `${process.env.IBM_NLP_URL}/v1/analyze?version=2022-04-07`,
      {
        text,
        features: {
          entities: { sentiment: false, limit: 50 },
          keywords: { sentiment: false, limit: 30 },
          categories: { limit: 5 }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    return normaliseNlpResponse(resp.data, text);
  } catch (err) {
    logger.error('IBM NLP failed, using rule fallback', { error: err.message });
    return normaliseWithRules(text);
  }
}

// Map IBM NLP entities + keywords → standard coverage tags
function normaliseNlpResponse(nlpData, rawText) {
  const keywords = (nlpData.keywords || []).map(k => k.text.toLowerCase());
  const entities = (nlpData.entities || []).map(e => e.text.toLowerCase());
  const allTerms = [...keywords, ...entities];

  const covered = [];
  const excluded = [];
  const ambiguous = [];

  for (const [tag, synonyms] of Object.entries(STANDARD_TAGS)) {
    const matched = synonyms.some(s => allTerms.some(t => t.includes(s)));
    if (!matched) continue;

    // Check surrounding context in raw text for exclusion signals
    const isExcluded = synonyms.some(s => {
      const idx = rawText.toLowerCase().indexOf(s);
      if (idx === -1) return false;
      const context = rawText.toLowerCase().slice(Math.max(0, idx - 80), idx + 120);
      return /\b(exclud|not covered|does not cover|excluded from|no coverage)\b/.test(context);
    });

    const isLimited = synonyms.some(s => {
      const idx = rawText.toLowerCase().indexOf(s);
      if (idx === -1) return false;
      const context = rawText.toLowerCase().slice(Math.max(0, idx - 80), idx + 120);
      return /\b(limit|sub-limit|sublimit|up to|maximum|subject to)\b/.test(context);
    });

    if (isExcluded) excluded.push(tag);
    else if (isLimited) ambiguous.push({ tag, note: 'covered with sublimit' });
    else covered.push(tag);
  }

  return { covered, excluded, ambiguous };
}

// Pure rule-based fallback — no API needed
function normaliseWithRules(text) {
  const lower = text.toLowerCase();
  const covered = [];
  const excluded = [];
  const ambiguous = [];

  for (const [tag, synonyms] of Object.entries(STANDARD_TAGS)) {
    for (const synonym of synonyms) {
      const idx = lower.indexOf(synonym);
      if (idx === -1) continue;

      const context = lower.slice(Math.max(0, idx - 100), idx + 150);

      const isExcluded = /\b(exclud|not covered|does not cover|no coverage for)\b/.test(context);
      const isLimited  = /\b(limit|sublimit|up to \$|maximum of \$)\b/.test(context);

      if (isExcluded && !excluded.includes(tag)) excluded.push(tag);
      else if (isLimited && !covered.includes(tag) && !excluded.includes(tag)) {
        ambiguous.push({ tag, note: 'covered with sublimit' });
      } else if (!covered.includes(tag) && !excluded.includes(tag)) {
        covered.push(tag);
      }
      break; // found a synonym, no need to check others for this tag
    }
  }

  return { covered, excluded, ambiguous };
}

// Normalise a single raw term to our standard tag
function normaliseToStandardTag(rawTerm) {
  const lower = rawTerm.toLowerCase();
  for (const [tag, synonyms] of Object.entries(STANDARD_TAGS)) {
    if (synonyms.some(s => lower.includes(s))) return tag;
  }
  return rawTerm; // return as-is if no match
}

module.exports = { extractEntitiesWithNlp, normaliseWithRules, normaliseToStandardTag, STANDARD_TAGS };
