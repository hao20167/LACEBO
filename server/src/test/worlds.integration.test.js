import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('E1.5 Integration: create world -> search -> detail', () => {
  let app;
  let db;
  let testDbPath;
  let userSequence;

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
    userSequence = 0;
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
    cleanupTestDb(testDbPath);
    delete process.env.DB_PATH;
  });

  const createAuthedUser = (prefix, displayName) => {
    userSequence += 1;
    const username = `${prefix}_${userSequence}`;
    const user = createTestUser({
      db,
      username,
      email: `${username}@example.com`,
      password: 'Password123!',
      displayName,
    });

    return {
      user,
      token: createTestToken(user),
    };
  };

  const createWorld = (token, payload) => {
    return request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  };

  test('should create a world, find it by search, and fetch detail with membership', async () => {
    const { user, token } = createAuthedUser('e15_creator', 'E1.5 Creator');
    const title = `E1.5 World ${Date.now()}`;

    const createRes = await createWorld(token, {
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
    expect(Array.isArray(searchRes.body.data)).toBe(true);
    const foundWorld = searchRes.body.data.find((w) => w.id === worldId);
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

  test('should hide worlds scheduled for deletion from public lists immediately', async () => {
    const user = createTestUser({
      db,
      username: 'delete_list_dev',
      email: 'delete_list_dev@example.com',
      displayName: 'Delete List Dev',
    });
    const token = createTestToken(user);

    const createRes = await request(app)
      .post('/api/worlds')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Hidden Scheduled World',
        description: 'Should not appear in Explore Worlds after scheduling deletion',
      });
    const worldId = createRes.body.id;

    const scheduleRes = await request(app)
      .post(`/api/worlds/${worldId}/schedule-delete`)
      .set('Authorization', `Bearer ${token}`);

    expect(scheduleRes.status).toBe(200);
    expect(scheduleRes.body.deletion_scheduled_at).toBeTruthy();

    const listRes = await request(app).get('/api/worlds');
    expect(listRes.status).toBe(200);
    expect(listRes.body.some((world) => world.id === worldId)).toBe(false);

    const mineRes = await request(app)
      .get('/api/worlds/mine')
      .set('Authorization', `Bearer ${token}`);
    expect(mineRes.status).toBe(200);
    expect(mineRes.body.some((world) => world.id === worldId)).toBe(false);
  });
});
