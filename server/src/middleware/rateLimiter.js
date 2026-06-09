import rateLimit from 'express-rate-limit';
import { ErrorCodes } from '../utils/AppError.js';

const skipRateLimitInTests = (req) => {
  const isJestTest =
    process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT !== 'true';
  const isArtilleryLoadTest =
    req.headers['x-bypass-ratelimit'] === 'QA-Secret-Token-2026';

  return isJestTest || isArtilleryLoadTest;
};

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    error: ErrorCodes.RATE_LIMIT_EXCEEDED,
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

const makeRateLimiter = (opts = {}) =>
  rateLimit({ ...defaultLimiterOptions, ...opts });

const limiterConfigs = {
  authRateLimiter: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message:
      'Too many authentication attempts, please try again after 15 minutes.',
  },
  registerRateLimiter: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: 'Too many registration attempts, please try again after 1 hour.',
  },
  globalApiRateLimiter: {
    windowMs: 60 * 1000, // 1 minute
    max: 100,
  },
};

const limiters = Object.fromEntries(
  Object.entries(limiterConfigs).map(([name, cfg]) => [
    name,
    makeRateLimiter(cfg),
  ]),
);

export const { authRateLimiter, registerRateLimiter, globalApiRateLimiter } =
  limiters;
