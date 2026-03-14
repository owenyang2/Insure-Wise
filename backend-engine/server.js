require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');
const { logConfigStatus } = require('./config');
const searchRoute = require('./search');
const feedbackRoute = require('./feedback');
const healthRoute = require('./health');
const { initDb } = require('./client');
const { initRedis } = require('./session');
const { startNightlyCron } = require('./nightly-scraper');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  logger.info(`${req.method} ${req.path}`, { requestId: req.requestId });
  next();
});

// Routes
app.use('/api', searchRoute);
app.use('/api', feedbackRoute);
app.use('/api', healthRoute);

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

async function start() {
  try {
    await initDb();
    logger.info('Database connected');

    await initRedis();
    logger.info('Redis connected');

    // Start nightly cron (2am daily)
    startNightlyCron();
    logger.info('Nightly cron scheduled');

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      logger.info(`Insurance Agent Search Engine running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Startup failed', { error: err.message });
    process.exit(1);
  }
}

start();
