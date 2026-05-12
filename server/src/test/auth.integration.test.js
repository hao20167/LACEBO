import request from 'supertest';
import {
  cleanupTestDb,
  resetDatabase,
  setupTestDb,
} from './helpers/testDb.js';

describe('Auth API Integration Tests', () => {
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

  test('POST /api/users/register - Should register successfully', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'Password123!',
        display_name: 'New User'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', 'newuser');
  });

  test('POST /api/users/login - Should login successfully', async () => {
    // Register first
    await request(app).post('/api/users/register').send({
      username: 'loginuser',
      email: 'login@example.com',
      password: 'Password123!',
      display_name: 'Login User'
    });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        username: 'loginuser',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('E1.4 Integration: register -> login -> get current user info', async () => {
    const username = 'e14_user';
    const email = 'e14_user@example.com';
    const password = 'Password123!';
    const displayName = 'E1.4 User';

    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        username,
        email,
        password,
        display_name: displayName,
      });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body).toHaveProperty('token');
    expect(registerRes.body.user).toMatchObject({
      username,
      display_name: displayName,
    });

    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        username,
        password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');
    expect(loginRes.body.user).toMatchObject({
      username,
      email,
      display_name: displayName,
    });

    const meRes = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body).toMatchObject({
      username,
      email,
      display_name: displayName,
    });
    expect(meRes.body.id).toBeDefined();
    expect(meRes.body.created_at).toBeDefined();
  });

  test('POST /api/users/login - Should fail with wrong password', async () => {
    await request(app).post('/api/users/register').send({
      username: 'wrongpass',
      email: 'wrong@example.com',
      password: 'Password123!',
      display_name: 'Wrong Pass'
    });

    const res = await request(app)
      .post('/api/users/login')
      .send({
        username: 'wrongpass',
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });
});
