import request from 'supertest';
import {
  cleanupTestDb,
  resetDatabase,
  setupTestDb,
} from './helpers/testDb.js';
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

    const searchRes = await request(app).get('/api/worlds').query({ search: title });

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
});