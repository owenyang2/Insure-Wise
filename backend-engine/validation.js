const { STANDARD_TAGS } = require('./nlp');
const { config } = require('./config');

const VALID_COVERAGE_NEEDS = Object.keys(STANDARD_TAGS);

const VALID_BUSINESS_TYPES = [
  'bar', 'restaurant', 'cafe', 'retail', 'freelancer',
  'office', 'warehouse', 'salon', 'gym', 'clinic', 'other'
];

// Validate and sanitise a user_profile object
function validateUserProfile(profile) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!profile.business_type) {
    errors.push('business_type is required');
  } else if (!VALID_BUSINESS_TYPES.includes(profile.business_type)) {
    warnings.push(`Unknown business_type "${profile.business_type}" — proceeding, but recommendations may be less accurate`);
  }

  if (!profile.location || typeof profile.location !== 'string') {
    errors.push('location is required (e.g. "Toronto, ON")');
  }

  if (!Array.isArray(profile.coverage_needs) || profile.coverage_needs.length === 0) {
    errors.push('coverage_needs must be a non-empty array');
  } else {
    const invalid = profile.coverage_needs.filter(n => !VALID_COVERAGE_NEEDS.includes(n));
    if (invalid.length > 0) {
      warnings.push(`Unknown coverage needs ignored: ${invalid.join(', ')}. Valid: ${VALID_COVERAGE_NEEDS.join(', ')}`);
      profile.coverage_needs = profile.coverage_needs.filter(n => VALID_COVERAGE_NEEDS.includes(n));
    }
  }

  // Priority weights (Optional - defaults applied if missing)
  if (!profile.priority_weights) {
    profile.priority_weights = { ...config.scoring.defaultWeights };
    warnings.push('priority_weights omitted — using optimal default math constraints');
  } else {
    const w = profile.priority_weights;
    const required = ['coverage', 'price', 'rating', 'gap_penalty'];
    for (const key of required) {
      if (w[key] === undefined || w[key] === null) {
        errors.push(`priority_weights.${key} is required`);
      } else if (typeof w[key] !== 'number' || w[key] < 0 || w[key] > 100) {
        errors.push(`priority_weights.${key} must be a number between 0 and 100`);
      }
    }
    if (errors.filter(e => e.includes('priority_weights')).length === 0) {
      const total = w.coverage + w.price + w.rating + w.gap_penalty;
      if (total !== 100) {
        errors.push(`priority_weights must sum to 100 (got ${total})`);
      }
    }
  }

  // Optional fields with type checks
  if (profile.employees !== undefined) {
    profile.employees = parseInt(profile.employees);
    if (isNaN(profile.employees) || profile.employees < 0) {
      errors.push('employees must be a non-negative integer');
    }
  }

  if (profile.budget_max !== undefined && profile.budget_max !== null) {
    profile.budget_max = parseFloat(profile.budget_max);
    if (isNaN(profile.budget_max) || profile.budget_max <= 0) {
      errors.push('budget_max must be a positive number');
    }
  }

  if (profile.max_deductible !== undefined && profile.max_deductible !== null) {
    profile.max_deductible = parseInt(profile.max_deductible);
    if (isNaN(profile.max_deductible) || profile.max_deductible < 0) {
      errors.push('max_deductible must be a non-negative integer');
    }
  }

  return { errors, warnings, sanitised: profile };
}

// Express middleware factory
function validateProfileMiddleware(req, res, next) {
  if (!req.body.user_profile) {
    return res.status(400).json({ error: 'user_profile is required in request body' });
  }

  const { errors, warnings, sanitised } = validateUserProfile(req.body.user_profile);

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Invalid user_profile', details: errors });
  }

  req.body.user_profile = sanitised;
  if (warnings.length > 0) req.validationWarnings = warnings;

  next();
}

// Validate feedback request
function validateFeedbackMiddleware(req, res, next) {
  const { session_id, feedback_text } = req.body;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'session_id is required' });
  }

  if (!feedback_text || typeof feedback_text !== 'string' || !feedback_text.trim()) {
    return res.status(400).json({ error: 'feedback_text is required and must be non-empty' });
  }

  if (feedback_text.length > 500) {
    return res.status(400).json({ error: 'feedback_text must be under 500 characters' });
  }

  req.body.feedback_text = feedback_text.trim();
  next();
}

module.exports = { validateUserProfile, validateProfileMiddleware, validateFeedbackMiddleware };
