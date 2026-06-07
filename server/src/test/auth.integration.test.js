import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';

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
    const res = await request(app).post('/api/users/register').send({
      username: 'newuser',
      email: 'newuser@example.com',
      password: 'Password123!',
      display_name: 'New User',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('username', 'newuser');
  });

  test('POST /api/users/register - Should fail when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({ username: 'missing-fields' });

    expect(res.status).toBe(400);
  });

  test('POST /api/users/register - Should fail on duplicate username', async () => {
    await request(app).post('/api/users/register').send({
      username: 'duplicate_user',
      email: 'duplicate-user@example.com',
      password: 'Password123!',
      display_name: 'Duplicate User',
    });

    const res = await request(app).post('/api/users/register').send({
      username: 'duplicate_user',
      email: 'duplicate-user-2@example.com',
      password: 'Password123!',
      display_name: 'Duplicate User 2',
    });

    expect(res.status).toBe(409);
  });

  test('POST /api/users/login - Should login successfully', async () => {
    // Register first
    await request(app).post('/api/users/register').send({
      username: 'loginuser',
      email: 'login@example.com',
      password: 'Password123!',
      display_name: 'Login User',
    });

    const res = await request(app).post('/api/users/login').send({
      username: 'loginuser',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  test('POST /api/users/login - Should fail when credentials are missing', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ username: 'no-password' });

    expect(res.status).toBe(400);
  });

  test('GET /api/users/me - Should require authentication', async () => {
    const res = await request(app).get('/api/users/me');

    expect(res.status).toBe(401);
  });

  test('GET /api/users/:id - Should return another user public profile', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      username: 'profile_user',
      email: 'profile_user@example.com',
      password: 'Password123!',
      display_name: 'Profile User',
    });

    const res = await request(app).get(
      `/api/users/${registerRes.body.user.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: registerRes.body.user.id,
      username: 'profile_user',
      display_name: 'Profile User',
    });
    expect(res.body).toHaveProperty('created_at');
    expect(res.body).not.toHaveProperty('email');
    expect(res.body).not.toHaveProperty('password');
  });

  test('GET /api/users/:id - Should return 404 when user does not exist', async () => {
    const res = await request(app).get('/api/users/999');

    expect(res.status).toBe(404);
  });

  test('GET /api/users/:id - Should validate user id', async () => {
    const res = await request(app).get('/api/users/not-a-number');

    expect(res.status).toBe(400);
  });

  test('PATCH /api/users/me - Should update current user profile', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      username: 'edit_profile',
      email: 'edit_profile@example.com',
      password: 'Password123!',
      display_name: 'Before Edit',
    });

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${registerRes.body.token}`)
      .send({
        display_name: 'After Edit',
        avatar: '/uploads/images/avatar.png',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: registerRes.body.user.id,
      username: 'edit_profile',
      email: 'edit_profile@example.com',
      display_name: 'After Edit',
      avatar_url: '/uploads/images/avatar.png',
    });
    expect(res.body).not.toHaveProperty('password');
  });

  test('PATCH /api/users/me - Should require authentication', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .send({ display_name: 'No Auth' });

    expect(res.status).toBe(401);
  });

  test('PATCH /api/users/me - Should reject empty updates', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      username: 'empty_profile_update',
      email: 'empty_profile_update@example.com',
      password: 'Password123!',
      display_name: 'Empty Update',
    });

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${registerRes.body.token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  test('PATCH /api/users/me - Should validate display name and avatar', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      username: 'invalid_profile_update',
      email: 'invalid_profile_update@example.com',
      password: 'Password123!',
      display_name: 'Invalid Update',
    });

    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${registerRes.body.token}`)
      .send({ display_name: '   ', avatar: '' });

    expect(res.status).toBe(400);
  });

  test('E1.4 Integration: register -> login -> get current user info', async () => {
    const username = 'e14_user';
    const email = 'e14_user@example.com';
    const password = 'Password123!';
    const displayName = 'E1.4 User';

    const registerRes = await request(app).post('/api/users/register').send({
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

    const loginRes = await request(app).post('/api/users/login').send({
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
      display_name: 'Wrong Pass',
    });

    const res = await request(app).post('/api/users/login').send({
      username: 'wrongpass',
      password: 'wrongpassword',
    });

    expect(res.status).toBe(401);
  });
});
