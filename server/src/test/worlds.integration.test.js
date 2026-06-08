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

  test('should allow a rejected member to request joining again', async () => {
    const dev = createTestUser({
      db,
      username: 'rejoin_dev',
      email: 'rejoin_dev@example.com',
      displayName: 'Rejoin Dev',
    });
    const player = createTestUser({
      db,
      username: 'rejoin_player',
      email: 'rejoin_player@example.com',
      displayName: 'Rejoin Player',
    });
    const devToken = createTestToken(dev);
    const playerToken = createTestToken(player);

    const createRes = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${devToken}`)
      .send({
        title: 'Rejoin World',
        description: 'World for rejoin flow',
      });
    const worldId = createRes.body.id;

    const firstJoinRes = await request(app)
      .post(`/api/worlds/${worldId}/join`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(firstJoinRes.status).toBe(201);
    expect(firstJoinRes.body.status).toBe('pending');

    const rejectRes = await request(app)
      .patch(`/api/worlds/${worldId}/members/${firstJoinRes.body.id}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({ status: 'rejected' });

    expect(rejectRes.status).toBe(200);

    const rejoinRes = await request(app)
      .post(`/api/worlds/${worldId}/join`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(rejoinRes.status).toBe(201);
    expect(rejoinRes.body.id).toBe(firstJoinRes.body.id);
    expect(rejoinRes.body.status).toBe('pending');
    expect(rejoinRes.body.role).toBe('player');

    const pendingRes = await request(app)
      .get(`/api/worlds/${worldId}/members/pending`)
      .set('Authorization', `Bearer ${devToken}`);

    expect(pendingRes.status).toBe(200);
    expect(pendingRes.body).toHaveLength(1);
    expect(pendingRes.body[0]).toMatchObject({
      id: firstJoinRes.body.id,
      user_id: player.id,
      status: 'pending',
    });
  });
});
