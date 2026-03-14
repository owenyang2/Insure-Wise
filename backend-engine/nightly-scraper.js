require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const cron = require('node-cron');
const { getAllCarrierUrls, upsertPolicy } = require('./client');
const { downloadPdf, extractWithWDU } = require('./wdu');
const logger = require('./logger');

async function runNightlyScrape() {
  logger.info('Nightly policy scrape started');
  const startTime = Date.now();

  const carriers = await getAllCarrierUrls();
  logger.info(`Scraping ${carriers.length} carriers`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const carrier of carriers) {
    try {
      logger.info(`Processing ${carrier.carrier_name}`);

      // Download PDF
      const { buffer, hash } = await downloadPdf(carrier.pdf_url);

      // Check if changed since last run
      const { pool } = require('./client');
      const { rows } = await pool.query(
        'SELECT pdf_hash FROM policies WHERE carrier_id = $1',
        [carrier.carrier_id]
      );

      if (rows[0]?.pdf_hash === hash) {
        logger.info(`${carrier.carrier_name} — unchanged, skipping`);
        skipped++;
        continue;
      }

      // Extract with WDU (or pdf-parse fallback)
      const extracted = await extractWithWDU(buffer, carrier.carrier_id);

      // Store in DB
      await upsertPolicy({
        carrier_id: carrier.carrier_id,
        carrier_name: carrier.carrier_name,
        pdf_url: carrier.pdf_url,
        pdf_hash: hash,
        ...extracted
      });

      logger.info(`${carrier.carrier_name} — updated`, {
        covered: extracted.covered?.length,
        excluded: extracted.excluded?.length
      });
      updated++;

      // Small delay to avoid hammering carrier sites
      await sleep(2000);

    } catch (err) {
      logger.error(`Failed to process ${carrier.carrier_name}`, {
        error: err.message,
        carrier_id: carrier.carrier_id
      });
      failed++;
    }
  }

  const duration = Math.round((Date.now() - startTime) / 1000);
  logger.info('Nightly scrape complete', { updated, skipped, failed, duration_seconds: duration });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Start cron (2am daily)
function startNightlyCron() {
  cron.schedule('0 2 * * *', () => {
    runNightlyScrape().catch(err => {
      logger.error('Nightly scrape crashed', { error: err.message });
    });
  });
  logger.info('Nightly scraper scheduled for 2:00 AM daily');
}

// Allow running directly: node scripts/nightly-scraper.js
if (require.main === module) {
  const { initDb } = require('./client');
  initDb()
    .then(() => runNightlyScrape())
    .then(() => process.exit(0))
    .catch(err => {
      logger.error('Scraper failed', { error: err.message });
      process.exit(1);
    });
}

module.exports = { startNightlyCron, runNightlyScrape };
