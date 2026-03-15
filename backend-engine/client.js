const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  try {
    const client = await pool.connect();
    try {
      // Create policies table — populated by nightly scraper
      await client.query(`
        CREATE TABLE IF NOT EXISTS policies (
          carrier_id          VARCHAR PRIMARY KEY,
          carrier_name        VARCHAR NOT NULL,
          covered             JSONB DEFAULT '[]',
          excluded            JSONB DEFAULT '[]',
          liability_limit     VARCHAR,
          deductible_min      INTEGER,
          deductible_max      INTEGER,
          waiting_period      VARCHAR,
          claim_process       VARCHAR,
          raw_exclusion_text  TEXT,
          pdf_url             VARCHAR,
          pdf_hash            VARCHAR,
          last_updated        TIMESTAMP DEFAULT NOW()
        );
      `);

      // Create carrier URL registry
      await client.query(`
        CREATE TABLE IF NOT EXISTS carrier_urls (
          carrier_id    VARCHAR PRIMARY KEY,
          carrier_name  VARCHAR NOT NULL,
          pdf_url       VARCHAR NOT NULL,
          active        BOOLEAN DEFAULT true
        );
      `);

      // Seed initial carriers if empty
      const { rowCount } = await client.query('SELECT 1 FROM carrier_urls LIMIT 1');
      if (rowCount === 0) {
        await seedCarriers(client);
      }

      logger.info('Database schema ready');
    } finally {
      client.release();
    }
  } catch (err) {
    logger.warn('Postgres database unavailable, running API in DB-less mock mode.');
  }
}

async function seedCarriers(client) {
  // Real carrier PDF URLs — update with actual URLs for your market
  const carriers = [
    { id: 'intact_commercial', name: 'Intact Commercial', url: 'https://www.intact.ca/docs/commercial-policy-wording.pdf' },
    { id: 'aviva_business',    name: 'Aviva Business',    url: 'https://www.avivacanada.com/docs/business-policy.pdf' },
    { id: 'economical',        name: 'Economical',        url: 'https://www.economical.com/docs/commercial-wording.pdf' },
    { id: 'northbridge',       name: 'Northbridge',       url: 'https://www.northbridgeinsurance.ca/docs/policy.pdf' },
    { id: 'wawanesa',          name: 'Wawanesa',          url: 'https://www.wawanesa.com/docs/commercial-policy.pdf' },
  ];

  for (const c of carriers) {
    await client.query(
      `INSERT INTO carrier_urls (carrier_id, carrier_name, pdf_url)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [c.id, c.name, c.url]
    );
  }
  logger.info(`Seeded ${carriers.length} carriers`);
}

async function getPolicyByCarrierId(carrierId) {
  const { rows } = await pool.query(
    'SELECT * FROM policies WHERE carrier_id = $1',
    [carrierId]
  );
  return rows[0] || null;
}

async function getPoliciesByCarrierIds(carrierIds) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM policies WHERE carrier_id = ANY($1)',
      [carrierIds]
    );
    // Return as map for O(1) lookup
    return rows.reduce((acc, row) => {
      acc[row.carrier_id] = row;
      return acc;
    }, {});
  } catch (err) {
    return {}; // Return empty map if DB doesn't exist
  }
}

async function upsertPolicy(policy) {
  await pool.query(`
    INSERT INTO policies (
      carrier_id, carrier_name, covered, excluded, liability_limit,
      deductible_min, deductible_max, waiting_period, claim_process,
      raw_exclusion_text, pdf_url, pdf_hash, last_updated
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
    ON CONFLICT (carrier_id) DO UPDATE SET
      covered = EXCLUDED.covered,
      excluded = EXCLUDED.excluded,
      liability_limit = EXCLUDED.liability_limit,
      deductible_min = EXCLUDED.deductible_min,
      deductible_max = EXCLUDED.deductible_max,
      waiting_period = EXCLUDED.waiting_period,
      claim_process = EXCLUDED.claim_process,
      raw_exclusion_text = EXCLUDED.raw_exclusion_text,
      pdf_hash = EXCLUDED.pdf_hash,
      last_updated = NOW()
  `, [
    policy.carrier_id, policy.carrier_name,
    JSON.stringify(policy.covered), JSON.stringify(policy.excluded),
    policy.liability_limit, policy.deductible_min, policy.deductible_max,
    policy.waiting_period, policy.claim_process,
    policy.raw_exclusion_text, policy.pdf_url, policy.pdf_hash
  ]);
}

async function getAllCarrierUrls() {
  const { rows } = await pool.query('SELECT * FROM carrier_urls WHERE active = true');
  return rows;
}

module.exports = { initDb, getPolicyByCarrierId, getPoliciesByCarrierIds, upsertPolicy, getAllCarrierUrls, pool };
