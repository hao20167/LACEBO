import rateLimit from 'express-rate-limit';

// By default, skip rate limiting during the Jest test run to avoid interfering
// with tests that make many requests. To explicitly enable rate limiting for
// the rate limiter test suite, set the environment variable
// `ENABLE_RATE_LIMIT=true` when running tests.
const skipRateLimitInTests = () =>
  process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT !== 'true';

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
  });
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // When running the focused rate limiter tests, use a stable key so
  // supertest requests are aggregated under the same client identifier.
  keyGenerator: (req) =>
    process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT === 'true'
      ? req.headers['x-test-client'] || req.ip
      : req.ip,
  skip: skipRateLimitInTests,
  handler: rateLimitHandler,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
});

export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT === 'true'
      ? req.headers['x-test-client'] || req.ip
      : req.ip,
  skip: skipRateLimitInTests,
  handler: rateLimitHandler,
  message: 'Too many registration attempts, please try again after 1 hour.',
});

export const globalApiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT === 'true'
      ? req.headers['x-test-client'] || req.ip
      : req.ip,
  skip: skipRateLimitInTests,
  handler: rateLimitHandler,
});
