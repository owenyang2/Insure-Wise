const { createClient } = require('redis');
const logger = require('./logger');

let client = null;
const memoryStore = {}; // Fallback for local testing

async function initRedis() {
  try {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => logger.warn('Redis connection issue, using in-memory store.'));
    await client.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.warn('Redis unavailable, using local in-memory store for sessions');
    client = null;
  }
}

const SESSION_TTL = 60 * 60 * 2; // 2 hours

async function getSession(sessionId) {
  if (!client) return memoryStore[sessionId] || null;
  const data = await client.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

async function saveSession(sessionId, sessionData) {
  if (!client) {
    memoryStore[sessionId] = sessionData;
    return;
  }
  await client.setEx(
    `session:${sessionId}`,
    SESSION_TTL,
    JSON.stringify(sessionData)
  );
}

function createNewSession(userProfile) {
  return {
    session_id: require('uuid').v4(),
    user_profile: userProfile,
    cached_results: [],
    criteria_history: [
      {
        iteration: 1,
        needs: userProfile.coverage_needs,
        weights: userProfile.priority_weights,
        budget_max: userProfile.budget_max,
        timestamp: new Date().toISOString()
      }
    ],
    rejected_plan_ids: [],
    iteration: 1,
    created_at: new Date().toISOString()
  };
}

module.exports = { initRedis, getSession, saveSession, createNewSession };
