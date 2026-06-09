// Enable the rate limiter for this test file so the limiter behavior is exercised
process.env.ENABLE_RATE_LIMIT = 'true';
import request from 'supertest';
import { createAppContext } from './helpers/appContext.js';

describe('Rate Limiting Tests', () => {
  const ctx = createAppContext();

  describe('POST /api/users/login - auth rate limiter', () => {
    const loginPayload = { username: 'nonexistent', password: 'wrongpass' };

    test('allows requests under the rate limit', async () => {
      const res = await request(ctx.app).post('/api/users/login').send(loginPayload);
      expect(res.status).not.toBe(429);
    });

    test('responds with 429 and structured error after exceeding auth limit', async () => {
      let lastRes;
      for (let i = 0; i <= 10; i++) {
        lastRes = await request(ctx.app)
          .post('/api/users/login')
          .set('x-test-client', 'limit-login')
          .send(loginPayload);
      }
      expect(lastRes.status).toBe(429);
      expect(lastRes.body).toHaveProperty('error', 'RATE_LIMIT_EXCEEDED');
      expect(lastRes.body).toHaveProperty('message');
    });

    test('429 response includes RateLimit headers', async () => {
      let lastRes;
      for (let i = 0; i <= 10; i++) {
        lastRes = await request(ctx.app)
          .post('/api/users/login')
          .set('x-test-client', 'limit-login')
          .send(loginPayload);
      }
      expect(lastRes.status).toBe(429);
      expect(lastRes.headers).toMatchObject(
        expect.objectContaining({ 'ratelimit-limit': expect.any(String) }),
      );
    });
  });

  describe('POST /api/users/register - register rate limiter', () => {
    const makePayload = (n) => ({
      username: `ratelimituser${n}`,
      email: `ratelimit${n}@example.com`,
      password: 'Password123',
      display_name: `Rate Limit User ${n}`,
    });

    test('allows registrations under the hourly limit', async () => {
      const res = await request(ctx.app).post('/api/users/register').send(makePayload(1));
      expect(res.status).not.toBe(429);
    });

    test('responds with 429 after exceeding register limit', async () => {
      let lastRes;
      for (let i = 0; i <= 5; i++) {
        lastRes = await request(ctx.app)
          .post('/api/users/register')
          .set('x-test-client', 'limit-register')
          .send(makePayload(i + 100));
      }
      expect(lastRes.status).toBe(429);
      expect(lastRes.body.error).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Global API rate limiter', () => {
    test('health endpoint is rate-limited after 100 req/min', async () => {
      let lastRes;
      for (let i = 0; i <= 100; i++) {
        lastRes = await request(ctx.app).get('/api/health').set('x-test-client', 'limit-health');
      }
      expect(lastRes.status).toBe(429);
    });

    test('non-rate-limited response has RateLimit headers', async () => {
      const res = await request(ctx.app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('ratelimit-limit');
    });
  });
});
