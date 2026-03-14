// Central config — all env vars in one place with defaults
// Import this instead of process.env directly

const config = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development'
  },

  db: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/insurance_agent'
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    sessionTtl: 60 * 60 * 2  // 2 hours
  },

  watsonx: {
    apiKey:    process.env.WATSONX_API_KEY,
    projectId: process.env.WATSONX_PROJECT_ID,
    url:       process.env.WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
    modelId:   process.env.WATSONX_MODEL_ID || 'ibm/granite-13b-instruct-v2',
    isConfigured: !!(process.env.WATSONX_API_KEY && process.env.WATSONX_PROJECT_ID
                  && process.env.WATSONX_API_KEY !== 'your_watsonx_api_key_here')
  },

  wdu: {
    apiKey:    process.env.WDU_API_KEY,
    url:       process.env.WDU_URL,
    projectId: process.env.WDU_PROJECT_ID,
    isConfigured: !!(process.env.WDU_API_KEY
                  && process.env.WDU_API_KEY !== 'your_watson_document_understanding_key_here')
  },

  nlp: {
    apiKey: process.env.IBM_NLP_API_KEY,
    url:    process.env.IBM_NLP_URL,
    isConfigured: !!(process.env.IBM_NLP_API_KEY
                  && process.env.IBM_NLP_API_KEY !== 'your_ibm_nlp_key_here')
  },

  aggregator: {
    provider: process.env.AGGREGATOR_PROVIDER || 'everquote',
    apiKey:   process.env.AGGREGATOR_API_KEY,
    url:      process.env.AGGREGATOR_URL || 'https://api.everquote.com/v1',
    partnerId: process.env.AGGREGATOR_PARTNER_ID || 'insureiq',
    isConfigured: !!(process.env.AGGREGATOR_API_KEY
                  && process.env.AGGREGATOR_API_KEY !== 'your_aggregator_api_key_here')
  },

  scoring: {
    // Default weights if none provided
    defaultWeights: { coverage: 40, price: 30, rating: 20, gap_penalty: 10 },
    // Per-gap penalty deduction
    gapPenaltyPerMissing: 0.12,
    // Rating normalisation range
    ratingMin: 3.0,
    ratingMax: 5.0
  },

  nightly: {
    // Cron schedule — default 2am daily
    schedule: process.env.SCRAPER_SCHEDULE || '0 2 * * *',
    // Delay between carrier scrapes (ms)
    delayBetweenCarriers: 2000,
    // Timeout per PDF download (ms)
    pdfDownloadTimeout: 30000
  }
};

// Warn on startup about missing optional services
function logConfigStatus(logger) {
  if (!config.watsonx.isConfigured)   logger.warn('Watsonx.ai not configured — AI scoring disabled, using defaults');
  if (!config.wdu.isConfigured)       logger.warn('WDU not configured — using pdf-parse fallback');
  if (!config.nlp.isConfigured)       logger.warn('IBM NLP not configured — using rule-based normalisation');
  if (!config.aggregator.isConfigured) logger.warn('Aggregator not configured — using mock quote data');
}

module.exports = { config, logConfigStatus };
