import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('Posts, Comments, and Likes Routes Integration', () => {
  let app;
  let db;
  let testDbPath;
  let devToken, playerToken;
  let devUser, playerUser;
  let worldId, eventId;

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
    
    // Create users
    devUser = createTestUser({
      db, username: 'dev_user', email: 'dev@test.com', password: 'Password123!', displayName: 'Dev User'
    });
    devToken = createTestToken(devUser);
    
    playerUser = createTestUser({
      db, username: 'player_user', email: 'player@test.com', password: 'Password123!', displayName: 'Player User'
    });
    playerToken = createTestToken(playerUser);

    // Create world & assign roles
    const worldResult = db.prepare(
      'INSERT INTO worlds (title, description, is_public) VALUES (?, ?, ?)'
    ).run('Test World', 'World for testing posts', 1);
    worldId = worldResult.lastInsertRowid;

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'dev', 'approved')"
    ).run(worldId, devUser.id);
    
    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'player', 'approved')"
    ).run(worldId, playerUser.id);

    // Create open event
    const eventResult = db.prepare(
      "INSERT INTO events (world_id, title, event_type, status, created_by) VALUES (?, ?, 'small', 'open', ?)"
    ).run(worldId, 'Test Event', devUser.id);
    eventId = eventResult.lastInsertRowid;
  });

  afterAll(() => {
    if (db) db.close();
    cleanupTestDb(testDbPath);
    delete process.env.DB_PATH;
  });

  describe('Posts', () => {
    it('should allow player to create a post, but it requires approval', async () => {
      const res = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Player post content' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Player post content');
      expect(res.body.status).toBe('pending');
      
      // Should not be visible in event posts yet
      const getRes = await request(app).get(`/api/posts/event/${eventId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveLength(0);
    });

    it('should allow dev to create a post that is automatically approved', async () => {
      const res = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'Dev post content' });

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Dev post content');
      expect(res.body.status).toBe('approved');
      
      // Should be visible in event posts
      const getRes = await request(app).get(`/api/posts/event/${eventId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveLength(1);
      expect(getRes.body[0].content).toBe('Dev post content');
    });

    it('should allow dev to view pending posts and approve them', async () => {
      // Player creates post
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Needs approval' });
      const postId = createRes.body.id;

      // Dev views pending posts
      const pendingRes = await request(app)
        .get(`/api/posts/world/${worldId}/pending`)
        .set('Authorization', `Bearer ${devToken}`);
      
      expect(pendingRes.status).toBe(200);
      expect(pendingRes.body).toHaveLength(1);
      expect(pendingRes.body[0].content).toBe('Needs approval');

      // Dev approves post
      const approveRes = await request(app)
        .patch(`/api/posts/${postId}/approve`)
        .set('Authorization', `Bearer ${devToken}`);
      
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);

      // Verify it is now visible in the event
      const getRes = await request(app).get(`/api/posts/event/${eventId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body).toHaveLength(1);
      expect(getRes.body[0].content).toBe('Needs approval');
    });
  });

  describe('Likes and Comments', () => {
    let postId;

    beforeEach(async () => {
      // Dev creates an approved post to interact with
      const res = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'Interact with me' });
      postId = res.body.id;
    });

    it('should allow user to like and unlike a post', async () => {
      // Like
      const likeRes = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${playerToken}`);
      expect(likeRes.status).toBe(200);
      expect(likeRes.body.liked).toBe(true);

      // Verify like count
      const getRes1 = await request(app).get(`/api/posts/event/${eventId}`);
      expect(getRes1.body[0].like_count).toBe(1);

      // Unlike
      const unlikeRes = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${playerToken}`);
      expect(unlikeRes.status).toBe(200);
      expect(unlikeRes.body.liked).toBe(false);

      // Verify like count
      const getRes2 = await request(app).get(`/api/posts/event/${eventId}`);
      expect(getRes2.body[0].like_count).toBe(0);
    });

    it('should allow user to add comments to a post and fetch them', async () => {
      // Add comment
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'This is a comment' });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body.content).toBe('This is a comment');
      expect(commentRes.body.user_id).toBe(playerUser.id);

      // Fetch comments
      const getCommentsRes = await request(app).get(`/api/posts/${postId}/comments`);
      expect(getCommentsRes.status).toBe(200);
      expect(getCommentsRes.body).toHaveLength(1);
      expect(getCommentsRes.body[0].content).toBe('This is a comment');
      expect(getCommentsRes.body[0].username).toBe(playerUser.username);
    });
  });
});
