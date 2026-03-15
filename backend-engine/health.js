const express = require('express');
const router = express.Router();
const { pool } = require('./client');

router.get('/health', async (req, res) => {
  const checks = {};

  // DB check
  try {
    await pool.query('SELECT 1');
    checks.database = 'ok';
  } catch (e) {
    checks.database = `error: ${e.message}`;
  }

  // Watsonx config check
  checks.watsonx = process.env.WATSONX_API_KEY && process.env.WATSONX_API_KEY !== 'your_watsonx_api_key_here'
    ? 'configured' : 'not configured (using fallbacks)';

  checks.aggregator = process.env.AGGREGATOR_API_KEY && process.env.AGGREGATOR_API_KEY !== 'your_aggregator_api_key_here'
    ? 'configured' : 'not configured (using mock data)';

  checks.wdu = process.env.WDU_API_KEY && process.env.WDU_API_KEY !== 'your_watson_document_understanding_key_here'
    ? 'configured' : 'not configured (using pdf-parse fallback)';

  const allOk = checks.database === 'ok';
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  });
});

module.exports = router;
