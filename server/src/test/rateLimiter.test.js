import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';

describe('Rate Limiting Tests', () => {
  let app;
  let db;
  let testDbPath;

  beforeAll(async () => {
    testDbPath = setupTestDb();
    const dbModule = await import('../database/connection.js');
    db = dbModule.default;
    const schemaModule = await import('../database/schema.js');
    schemaModule.initDatabase();
    const appModule = await import('../index.js');
    app = appModule.default;
  });

  beforeEach(() => {
    resetDatabase(db);
  });

  afterAll(() => {
    if (db) db.close();
    cleanupTestDb(testDbPath);
  });

  describe('POST /api/users/login - auth rate limiter', () => {
    const loginPayload = { username: 'nonexistent', password: 'wrongpass' };

    test('allows requests under the rate limit', async () => {
      const res = await request(app).post('/api/users/login').send(loginPayload);
      // Should get 401 (bad credentials), not 429 (rate limited)
      expect(res.status).not.toBe(429);
    });

    test('responds with 429 and structured error after exceeding auth limit', async () => {
      const MAX_ATTEMPTS = 10;
      let lastRes;

      for (let i = 0; i <= MAX_ATTEMPTS; i++) {
        lastRes = await request(app).post('/api/users/login').send(loginPayload);
      }

      expect(lastRes.status).toBe(429);
      expect(lastRes.body).toHaveProperty('error', 'RATE_LIMIT_EXCEEDED');
      expect(lastRes.body).toHaveProperty('message');
    });

    test('429 response includes RateLimit headers', async () => {
      const MAX_ATTEMPTS = 10;
      let lastRes;
      for (let i = 0; i <= MAX_ATTEMPTS; i++) {
        lastRes = await request(app).post('/api/users/login').send(loginPayload);
      }

      expect(lastRes.status).toBe(429);
      // express-rate-limit with standardHeaders=true sets RateLimit-* headers
      expect(lastRes.headers).toMatchObject(
        expect.objectContaining({
          'ratelimit-limit': expect.any(String),
        }),
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
      const res = await request(app)
        .post('/api/users/register')
        .send(makePayload(1));
      expect(res.status).not.toBe(429);
    });

    test('responds with 429 after exceeding register limit', async () => {
      const MAX_ATTEMPTS = 5;
      let lastRes;

      for (let i = 0; i <= MAX_ATTEMPTS; i++) {
        lastRes = await request(app)
          .post('/api/users/register')
          .send(makePayload(i + 100));
      }

      expect(lastRes.status).toBe(429);
      expect(lastRes.body.error).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Global API rate limiter', () => {
    test('health endpoint is rate-limited after 100 req/min', async () => {
      const GLOBAL_LIMIT = 100;
      let lastRes;

      for (let i = 0; i <= GLOBAL_LIMIT; i++) {
        lastRes = await request(app).get('/api/health');
      }

      expect(lastRes.status).toBe(429);
    });

    test('non-rate-limited response has RateLimit headers', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('ratelimit-limit');
    });
  });
});
