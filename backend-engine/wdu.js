const axios = require('axios');
const FormData = require('form-data');
const crypto = require('crypto');
const logger = require('./logger');

// IBM WDU token (reuses same IAM token flow as Watsonx)
let wduToken = null;
let wduTokenExpiry = 0;

async function getWduToken() {
  if (wduToken && Date.now() < wduTokenExpiry) return wduToken;

  const resp = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    new URLSearchParams({
      grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
      apikey: process.env.WDU_API_KEY
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  wduToken = resp.data.access_token;
  wduTokenExpiry = Date.now() + (resp.data.expires_in - 60) * 1000;
  return wduToken;
}

// Download a PDF and return buffer + hash
async function downloadPdf(url) {
  const resp = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 30000,
    headers: { 'User-Agent': 'InsureIQ-PolicyScraper/1.0' }
  });

  const buffer = Buffer.from(resp.data);
  const hash = crypto.createHash('md5').update(buffer).digest('hex');
  return { buffer, hash };
}

// Send PDF to Watson Document Understanding
async function extractWithWDU(pdfBuffer, carrierId) {
  // If WDU not configured, use pdf-parse fallback
  if (!process.env.WDU_API_KEY || process.env.WDU_API_KEY === 'your_watson_document_understanding_key_here') {
    return extractWithPdfParse(pdfBuffer, carrierId);
  }

  const token = await getWduToken();
  const form = new FormData();
  form.append('file', pdfBuffer, { filename: `${carrierId}-policy.pdf`, contentType: 'application/pdf' });

  const resp = await axios.post(
    `${process.env.WDU_URL}/v2/projects/${process.env.WDU_PROJECT_ID}/document_classifiers`,
    form,
    {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      timeout: 60000
    }
  );

  return normaliseWduResponse(resp.data, carrierId);
}

// Fallback: use pdf-parse + rule-based extraction when WDU not configured
async function extractWithPdfParse(pdfBuffer, carrierId) {
  logger.warn(`Using pdf-parse fallback for ${carrierId} — configure WDU_API_KEY for full extraction`);

  const pdfParse = require('pdf-parse');
  const data = await pdfParse(pdfBuffer);
  const text = data.text.toLowerCase();

  return {
    covered: extractCoveredItems(text),
    excluded: extractExcludedItems(text),
    liability_limit: extractLiabilityLimit(text),
    deductible_min: extractDeductibleMin(text),
    deductible_max: extractDeductibleMax(text),
    waiting_period: extractWaitingPeriod(text),
    claim_process: extractClaimProcess(text),
    raw_exclusion_text: extractExclusionSection(text)
  };
}

// Normalise WDU response to our unified policy schema
function normaliseWduResponse(wduData, carrierId) {
  // WDU returns entities and key-value pairs
  const entities = wduData.entities || [];
  const kvPairs = wduData.key_value_pairs || [];

  const getValue = (key) => {
    const pair = kvPairs.find(p => p.key?.toLowerCase().includes(key.toLowerCase()));
    return pair?.value || null;
  };

  return {
    covered: entities
      .filter(e => e.type === 'COVERAGE_INCLUDED')
      .map(e => normaliseTag(e.text)),
    excluded: entities
      .filter(e => e.type === 'COVERAGE_EXCLUDED')
      .map(e => normaliseTag(e.text)),
    liability_limit: getValue('liability limit') || getValue('coverage limit'),
    deductible_min: parseInt(getValue('deductible minimum') || '0'),
    deductible_max: parseInt(getValue('deductible maximum') || '5000'),
    waiting_period: getValue('waiting period') || 'none',
    claim_process: getValue('claims process') || 'contact insurer',
    raw_exclusion_text: entities
      .filter(e => e.type === 'EXCLUSION_CLAUSE')
      .map(e => e.text)
      .join('. ')
  };
}

// Rule-based coverage extraction from raw PDF text (fallback)
function extractCoveredItems(text) {
  const covered = [];
  const coverageMap = {
    'General Liability': ['general liability', 'third party liability', 'bodily injury'],
    'Liquor Liability': ['liquor liability', 'host liquor', 'dram shop'],
    'Property Damage': ['property damage', 'building coverage', 'contents coverage'],
    'Food Contamination': ['food contamination', 'product liability', 'food spoilage'],
    'Workers Comp': ["workers' compensation", 'workers compensation', 'employee injury'],
    'Cyber Liability': ['cyber liability', 'data breach', 'cyber incident'],
    'Business Interruption': ['business interruption', 'loss of income', 'business income'],
    'Equipment Breakdown': ['equipment breakdown', 'machinery breakdown', 'mechanical breakdown'],
  };

  for (const [tag, keywords] of Object.entries(coverageMap)) {
    const isExcluded = keywords.some(kw => {
      const idx = text.indexOf(kw);
      if (idx === -1) return false;
      const surrounding = text.slice(Math.max(0, idx - 50), idx + 100);
      return /exclu|not covered|does not cover|exclud/.test(surrounding);
    });

    const isPresent = keywords.some(kw => text.includes(kw));
    if (isPresent && !isExcluded) covered.push(tag);
  }

  return covered;
}

function extractExcludedItems(text) {
  const excluded = [];
  const coverageMap = {
    'General Liability': ['general liability', 'third party liability'],
    'Liquor Liability': ['liquor liability', 'host liquor'],
    'Property Damage': ['property damage', 'building coverage'],
    'Food Contamination': ['food contamination', 'food spoilage'],
    'Workers Comp': ['workers compensation'],
    'Cyber Liability': ['cyber liability', 'data breach'],
    'Business Interruption': ['business interruption'],
    'Equipment Breakdown': ['equipment breakdown'],
  };

  for (const [tag, keywords] of Object.entries(coverageMap)) {
    const isExcluded = keywords.some(kw => {
      const idx = text.indexOf(kw);
      if (idx === -1) return false;
      const surrounding = text.slice(Math.max(0, idx - 50), idx + 100);
      return /exclu|not covered|does not cover/.test(surrounding);
    });
    if (isExcluded) excluded.push(tag);
  }

  return excluded;
}

function extractLiabilityLimit(text) {
  const match = text.match(/liability limit[^\n]*?\$([0-9,]+(?:\s*million)?)/i);
  return match ? `$${match[1]}` : null;
}

function extractDeductibleMin(text) {
  const match = text.match(/deductible[^\n]*?\$([0-9,]+)/i);
  return match ? parseInt(match[1].replace(',', '')) : 500;
}

function extractDeductibleMax(text) {
  const match = text.match(/deductible[^\n]*?\$([0-9,]+)[^\n]*?to[^\n]*?\$([0-9,]+)/i);
  return match ? parseInt(match[2].replace(',', '')) : 5000;
}

function extractWaitingPeriod(text) {
  const match = text.match(/waiting period[^\n]*?(\d+\s*days?)/i);
  return match ? match[1] : 'none';
}

function extractClaimProcess(text) {
  if (text.includes('online claim')) return 'online or phone, 24/7';
  if (text.includes('phone')) return 'phone, business hours';
  return 'contact insurer directly';
}

function extractExclusionSection(text) {
  const idx = text.indexOf('exclusion');
  if (idx === -1) return '';
  return text.slice(idx, idx + 500).replace(/\s+/g, ' ').trim();
}

function normaliseTag(text) {
  // Map WDU entity text → our standard coverage tag names
  const tagMap = {
    'general liability': 'General Liability',
    'liquor': 'Liquor Liability',
    'property': 'Property Damage',
    'food contamination': 'Food Contamination',
    'workers comp': 'Workers Comp',
    'cyber': 'Cyber Liability',
    'business interruption': 'Business Interruption',
    'equipment': 'Equipment Breakdown',
  };

  const lower = text.toLowerCase();
  for (const [key, tag] of Object.entries(tagMap)) {
    if (lower.includes(key)) return tag;
  }
  return text; // return as-is if no match
}

module.exports = { downloadPdf, extractWithWDU };
