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

// Reusable key generator: in focused rate limiter tests we allow an explicit
// `x-test-client` header so multiple supertest requests can be grouped.
const keyGenerator = (req) =>
  process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT === 'true'
    ? req.headers['x-test-client'] || req.ip
    : req.ip;

const defaultLimiterOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: skipRateLimitInTests,
  handler: rateLimitHandler,
};

const makeRateLimiter = (opts = {}) => rateLimit({ ...defaultLimiterOptions, ...opts });

export const authRateLimiter = makeRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts, please try again after 15 minutes.',
});

export const registerRateLimiter = makeRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many registration attempts, please try again after 1 hour.',
});

export const globalApiRateLimiter = makeRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
});
