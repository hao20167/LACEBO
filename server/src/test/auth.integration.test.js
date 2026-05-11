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
