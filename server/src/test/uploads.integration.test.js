import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('Uploads API Integration Tests', () => {
  let app;
  let db;
  let testDbPath;
  let uploadDir;
  let token;

  beforeAll(async () => {
    uploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lacebo-uploads-'));
    process.env.UPLOAD_DIR = uploadDir;

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
    const user = createTestUser({
      db,
      username: 'upload_user',
      email: 'upload_user@example.com',
      password: 'Password123!',
      displayName: 'Upload User',
    });
    token = createTestToken(user);
  });

  afterAll(() => {
    if (db) db.close();
    cleanupTestDb(testDbPath);
    fs.rmSync(uploadDir, { recursive: true, force: true });
    delete process.env.DB_PATH;
    delete process.env.UPLOAD_DIR;
  });

  test('POST /api/uploads/images - Should upload an image file', async () => {
    const image = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', image, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      mimetype: 'image/png',
      size: image.length,
    });
    expect(res.body.url).toMatch(/^\/uploads\/images\/.+\.png$/);
    expect(
      fs.existsSync(path.join(uploadDir, 'images', res.body.filename)),
    ).toBe(true);
  });

  test('POST /api/uploads/images - Should require authentication', async () => {
    const res = await request(app).post('/api/uploads/images');

    expect(res.status).toBe(401);
  });

  test('POST /api/uploads/images - Should require an image file', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  test('POST /api/uploads/images - Should reject non-image files', async () => {
    const res = await request(app)
      .post('/api/uploads/images')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', Buffer.from('plain text'), {
        filename: 'note.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
  });
});
