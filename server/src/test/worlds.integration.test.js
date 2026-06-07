import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('E1.5 Integration: create world -> search -> detail', () => {
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
    if (db) {
      db.close();
    }
    cleanupTestDb(testDbPath);
    delete process.env.DB_PATH;
  });

  test('should create a world, find it by search, and fetch detail with membership', async () => {
    const user = createTestUser({
      db,
      username: 'e15_creator',
      email: 'e15_creator@example.com',
      password: 'Password123!',
      displayName: 'E1.5 Creator',
    });
    const token = createTestToken(user);
    const title = `E1.5 World ${Date.now()}`;

    const createRes = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title,
        description: 'Integration flow test world',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({
      title,
      description: 'Integration flow test world',
      is_public: 1,
    });
    expect(createRes.body.id).toBeDefined();
    const worldId = createRes.body.id;

    const searchRes = await request(app)
      .get('/api/worlds')
      .query({ search: title });

    expect(searchRes.status).toBe(200);
    expect(Array.isArray(searchRes.body)).toBe(true);
    const foundWorld = searchRes.body.find((w) => w.id === worldId);
    expect(foundWorld).toBeDefined();
    expect(foundWorld.title).toBe(title);

    const detailRes = await request(app)
      .get(`/api/worlds/${worldId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.id).toBe(worldId);
    expect(detailRes.body.title).toBe(title);
    expect(detailRes.body.membership).toMatchObject({
      user_id: user.id,
      role: 'dev',
      status: 'approved',
    });
  });

  test('PATCH /api/worlds/:id - Should allow owner to update a world', async () => {
    const owner = createTestUser({
      db,
      username: 'world_owner',
      email: 'world_owner@example.com',
      password: 'Password123!',
      displayName: 'World Owner',
    });
    const ownerToken = createTestToken(owner);

    const createRes = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Original World',
        description: 'Before update',
      });

    const res = await request(app)
      .patch(`/api/worlds/${createRes.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Updated World',
        description: 'After update',
        cover_image: '/uploads/images/world.png',
        is_public: false,
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: createRes.body.id,
      title: 'Updated World',
      description: 'After update',
      cover_image: '/uploads/images/world.png',
      is_public: 0,
      owner_id: owner.id,
    });
  });

  test('PATCH /api/worlds/:id - Should reject non-owner updates', async () => {
    const owner = createTestUser({
      db,
      username: 'world_owner_reject',
      email: 'world_owner_reject@example.com',
      password: 'Password123!',
      displayName: 'World Owner Reject',
    });
    const ownerToken = createTestToken(owner);
    const other = createTestUser({
      db,
      username: 'world_other',
      email: 'world_other@example.com',
      password: 'Password123!',
      displayName: 'World Other',
    });
    const otherToken = createTestToken(other);

    const createRes = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Owner Only World' });

    const res = await request(app)
      .patch(`/api/worlds/${createRes.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Forbidden Update' });

    expect(res.status).toBe(403);
  });

  test('PATCH /api/worlds/:id - Should reject empty updates', async () => {
    const owner = createTestUser({
      db,
      username: 'world_empty_update',
      email: 'world_empty_update@example.com',
      password: 'Password123!',
      displayName: 'World Empty Update',
    });
    const ownerToken = createTestToken(owner);

    const createRes = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Empty Update World' });

    const res = await request(app)
      .patch(`/api/worlds/${createRes.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('DELETE /api/worlds/:id - Should allow owner to delete a world', async () => {
    const owner = createTestUser({
      db,
      username: 'world_delete_owner',
      email: 'world_delete_owner@example.com',
      password: 'Password123!',
      displayName: 'World Delete Owner',
    });
    const ownerToken = createTestToken(owner);

    const createRes = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Delete World' });

    const res = await request(app)
      .delete(`/api/worlds/${createRes.body.id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(db.prepare('SELECT * FROM worlds WHERE id = ?').get(createRes.body.id)).toBeUndefined();
  });

  test('DELETE /api/worlds/:id - Should reject non-owner deletes', async () => {
    const owner = createTestUser({
      db,
      username: 'world_delete_reject_owner',
      email: 'world_delete_reject_owner@example.com',
      password: 'Password123!',
      displayName: 'World Delete Reject Owner',
    });
    const ownerToken = createTestToken(owner);
    const other = createTestUser({
      db,
      username: 'world_delete_other',
      email: 'world_delete_other@example.com',
      password: 'Password123!',
      displayName: 'World Delete Other',
    });
    const otherToken = createTestToken(other);

    const createRes = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Protected World' });

    const res = await request(app)
      .delete(`/api/worlds/${createRes.body.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });
});
