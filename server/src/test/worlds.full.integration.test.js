import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('World Full API Integration Tests', () => {
  let app;
  let db;
  let testDbPath;
  let devUser, playerUser;
  let devToken, playerToken;
  let worldId;

  beforeAll(async () => {
    testDbPath = setupTestDb();
    const dbModule = await import('../database/connection.js');
    db = dbModule.default;
    const schemaModule = await import('../database/schema.js');
    schemaModule.initDatabase();
    const appModule = await import('../index.js');
    app = appModule.default;

    // Create users
    devUser = createTestUser({
      db,
      username: 'dev_user',
      email: 'dev@test.com',
    });
    devToken = createTestToken(devUser);
    playerUser = createTestUser({
      db,
      username: 'player_user',
      email: 'player@test.com',
    });
    playerToken = createTestToken(playerUser);
  });

  afterAll(() => {
    if (db) db.close();
    cleanupTestDb(testDbPath);
  });

  test('1. POST /api/worlds - Create world', async () => {
    const res = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${devToken}`)
      .send({ title: 'Test World', description: 'Description' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    worldId = res.body.id;
  });

  test('1a. POST /api/worlds/:id/join - Reject missing world', async () => {
    const res = await request(app)
      .post('/api/worlds/999999/join')
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.status).toBe(404);
  });

  test('2. GET /api/worlds - List all worlds', async () => {
    const res = await request(app).get('/api/worlds');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('3. GET /api/worlds/:id - Get world detail', async () => {
    const res = await request(app).get(`/api/worlds/${worldId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Test World');
  });

  test('4. GET /api/worlds/mine - Get my worlds', async () => {
    const res = await request(app)
      .get('/api/worlds/mine')
      .set('Authorization', `Bearer ${devToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((w) => w.id === worldId)).toBe(true);
  });

  test('5. POST /api/worlds/:id/join - Join world', async () => {
    const res = await request(app)
      .post(`/api/worlds/${worldId}/join`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
  });

  test('5a. POST /api/worlds/:id/join - Reject duplicate join', async () => {
    const res = await request(app)
      .post(`/api/worlds/${worldId}/join`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.status).toBe(409);
  });

  test('7. GET /api/worlds/:id/members/pending - Get pending members', async () => {
    const res = await request(app)
      .get(`/api/worlds/${worldId}/members/pending`)
      .set('Authorization', `Bearer ${devToken}`);

    expect(res.status).toBe(200);
    expect(res.body.some((m) => m.user_id === playerUser.id)).toBe(true);
    // Store member record id for next step
    const member = res.body.find((m) => m.user_id === playerUser.id);
    playerUser.memberRecordId = member.id;
  });

  test('7a. GET /api/worlds/:id/members/pending - Reject non-dev access', async () => {
    const res = await request(app)
      .get(`/api/worlds/${worldId}/members/pending`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.status).toBe(403);
  });

  test('6. PATCH /api/worlds/:id/members/:memberId - Approve member', async () => {
    const res = await request(app)
      .patch(`/api/worlds/${worldId}/members/${playerUser.memberRecordId}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('6a. PATCH /api/worlds/:id/members/:memberId - Reject invalid status', async () => {
    const res = await request(app)
      .patch(`/api/worlds/${worldId}/members/${playerUser.memberRecordId}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ status: 'pending' });

    expect(res.status).toBe(400);
  });

  test('8. GET /api/worlds/:id/members - Get all approved members', async () => {
    const res = await request(app).get(`/api/worlds/${worldId}/members`);
    expect(res.status).toBe(200);
    expect(res.body.some((m) => m.user_id === playerUser.id)).toBe(true);
  });
});
