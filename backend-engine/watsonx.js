const axios = require('axios');
const logger = require('./logger');

// IBM Watsonx.ai token cache
let watsonxToken = null;
let tokenExpiry = 0;

async function getWatsonxToken() {
  if (watsonxToken && Date.now() < tokenExpiry) return watsonxToken;

  const resp = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: process.env.WATSONX_API_KEY
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  watsonxToken = resp.data.access_token;
  tokenExpiry = Date.now() + (resp.data.expires_in - 60) * 1000;
  return watsonxToken;
}

// Core Watsonx.ai generation call
async function watsonxGenerate(prompt, options = {}) {
  const token = await getWatsonxToken();

  const payload = {
    model_id: process.env.WATSONX_MODEL_ID || 'ibm/granite-13b-instruct-v2',
    project_id: process.env.WATSONX_PROJECT_ID,
    input: prompt,
    parameters: {
      decoding_method: 'greedy',
      max_new_tokens: options.maxTokens || 600,
      temperature: 0,        // deterministic — we want consistent JSON
      stop_sequences: ['```']
    }
  };

  const resp = await axios.post(
    `${process.env.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );

  const rawText = resp.data.results?.[0]?.generated_text || '';
  return parseJSON(rawText);
}

// Safe JSON parser — strips markdown fences if present
function parseJSON(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Try to extract JSON from text if model added prose
    const jsonMatch = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    logger.error('Failed to parse Watsonx JSON', { raw: text });
    throw new Error(`Watsonx returned unparseable response: ${text.slice(0, 200)}`);
  }
}

// Run multiple scorer prompts in parallel
async function watsonxBatch(prompts) {
  return Promise.allSettled(
    prompts.map(p => watsonxGenerate(p.prompt, p.options).then(result => ({ ...result, _plan_id: p.planId })))
  );
}

module.exports = { watsonxGenerate, watsonxBatch };
