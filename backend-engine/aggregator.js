const axios = require('axios');
const logger = require('./logger');

// Normalise user profile → aggregator request format
function buildAggregatorRequest(userProfile) {
  return {
    business_type: userProfile.business_type,
    location: userProfile.location,
    employees: parseInt(userProfile.employees) || 1,
    annual_revenue: userProfile.annual_revenue,
    alcohol_sales: userProfile.alcohol_sales || false,
    coverage_types: userProfile.coverage_needs,
    budget_max: userProfile.budget_max || null,
    state_province: extractProvince(userProfile.location)
  };
}

function extractProvince(location) {
  // e.g. "Toronto, ON" → "ON"
  const match = location.match(/,\s*([A-Z]{2})$/);
  return match ? match[1] : 'ON';
}

// Call EverQuote Pro API
async function fetchFromEverQuote(userProfile) {
  const payload = buildAggregatorRequest(userProfile);

  const resp = await axios.post(
    `${process.env.AGGREGATOR_URL}/commercial/quotes`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${process.env.AGGREGATOR_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Partner-Id': process.env.AGGREGATOR_PARTNER_ID || 'insureiq'
      },
      timeout: 15000
    }
  );

  return normaliseAggregatorResponse(resp.data.quotes || []);
}

// Call Bindable API (alternative to EverQuote)
async function fetchFromBindable(userProfile) {
  const payload = buildAggregatorRequest(userProfile);

  const resp = await axios.post(
    `${process.env.AGGREGATOR_URL}/quotes/commercial`,
    {
      applicant: payload,
      lines_of_business: userProfile.coverage_needs
    },
    {
      headers: {
        'X-API-Key': process.env.AGGREGATOR_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  return normaliseAggregatorResponse(resp.data.results || []);
}

// Call Coterie Sandbox API
async function fetchFromCoterie(userProfile) {
  // Coterie expects specific body payload for applications
  const resp = await axios.post(
    `${process.env.AGGREGATOR_URL}/commercial/applications`,
    {
      businessName: "Test Business Co",
      industry: userProfile.business_type,
      annualRevenue: 800000,
      employeeCount: parseInt(userProfile.employees) || 1,
      locations: [{ state: extractProvince(userProfile.location) }]
    },
    {
      headers: {
        'Authorization': `token ${process.env.AGGREGATOR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  // Map coterie structured estimates array to our format
  const estimates = resp.data.estimates || resp.data.rates || [];
  
  if (estimates.length === 0) {
     // Return at least a dummy coterie mock if the sandbox API doesn't generate rate arrays for the zip code
     return getMockQuotes(userProfile).map(q => ({...q, carrier_id: 'coterie_commercial', carrier_name: 'Coterie Insurance'}));
  }

  return estimates.map(e => ({
    carrier_id: 'coterie_commercial',
    carrier_name: 'Coterie Insurance',
    monthly_price: parseFloat(e.premium || e.monthly_premium || 150),
    plan_id: e.policyId || e.id || 'coterie-sample',
    coverage_summary: e.coverageType || 'BOP / GL',
    rating: 4.8,
    deductible: 500,
    apply_url: 'https://coterieinsurance.com/apply',
    raw_aggregator: e
  }));
}

// Normalise to unified schema regardless of aggregator
function normaliseAggregatorResponse(rawQuotes) {
  return rawQuotes.map(q => ({
    carrier_id: q.carrier_id || q.carrierId || slugify(q.carrier_name || q.carrierName),
    carrier_name: q.carrier_name || q.carrierName,
    monthly_price: parseFloat(q.monthly_premium || q.monthlyPrice || q.price || 0),
    plan_id: q.plan_id || q.planId || q.id,
    coverage_summary: q.coverage_summary || q.coverageSummary || '',
    rating: parseFloat(q.carrier_rating || q.rating || 4.0),
    deductible: parseInt(q.deductible || 1000),
    apply_url: q.apply_url || q.applyUrl || q.bindUrl || null,
    raw_aggregator: q  // keep original for debugging
  }));
}

function slugify(str) {
  return (str || '').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

// Fallback mock data — used when aggregator API not yet configured
function getMockQuotes(userProfile) {
  logger.warn('Using MOCK aggregator data — configure AGGREGATOR_API_KEY to use real data');
  return [
    { carrier_id: 'intact_commercial',  carrier_name: 'Intact Commercial',  monthly_price: 338, plan_id: 'intact-001', rating: 4.7, deductible: 2000, apply_url: 'https://intact.ca/apply' },
    { carrier_id: 'aviva_business',     carrier_name: 'Aviva Business',     monthly_price: 292, plan_id: 'aviva-001',  rating: 4.4, deductible: 1500, apply_url: 'https://aviva.ca/apply' },
    { carrier_id: 'economical',         carrier_name: 'Economical Insurance',monthly_price: 265, plan_id: 'econ-001',  rating: 4.1, deductible: 1000, apply_url: 'https://economical.com/apply' },
    { carrier_id: 'northbridge',        carrier_name: 'Northbridge',        monthly_price: 375, plan_id: 'north-001', rating: 4.6, deductible: 2500, apply_url: 'https://northbridge.ca/apply' },
    { carrier_id: 'wawanesa',           carrier_name: 'Wawanesa',           monthly_price: 310, plan_id: 'wawa-001',  rating: 4.3, deductible: 1500, apply_url: 'https://wawanesa.com/apply' },
  ].filter(q => !userProfile.budget_max || q.monthly_price <= userProfile.budget_max);
}

// Main entry: choose provider based on env, fall back to mock
async function fetchQuotes(userProfile) {
  if (!process.env.AGGREGATOR_API_KEY || process.env.AGGREGATOR_API_KEY === 'your_aggregator_api_key_here') {
    return getMockQuotes(userProfile);
  }

  try {
    const provider = process.env.AGGREGATOR_PROVIDER || 'everquote';
    logger.info(`Fetching quotes from ${provider}`);

    if (provider === 'bindable') return await fetchFromBindable(userProfile);
    if (provider === 'coterie') return await fetchFromCoterie(userProfile);
    return await fetchFromEverQuote(userProfile);

  } catch (err) {
    logger.error('Aggregator API failed', { error: err.message });
    // Graceful degradation to mock on failure
    return getMockQuotes(userProfile);
  }
}

module.exports = { fetchQuotes };
