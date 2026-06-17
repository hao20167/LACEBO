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
      db,
      username: 'dev_user',
      email: 'dev@test.com',
      password: 'Password123!',
      displayName: 'Dev User',
    });
    devToken = createTestToken(devUser);

    playerUser = createTestUser({
      db,
      username: 'player_user',
      email: 'player@test.com',
      password: 'Password123!',
      displayName: 'Player User',
    });
    playerToken = createTestToken(playerUser);

    // Create world & assign roles
    const worldResult = db
      .prepare(
        'INSERT INTO worlds (title, description, is_public) VALUES (?, ?, ?)',
      )
      .run('Test World', 'World for testing posts', 1);
    worldId = worldResult.lastInsertRowid;

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'dev', 'approved')",
    ).run(worldId, devUser.id);

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'player', 'approved')",
    ).run(worldId, playerUser.id);

    // Create open event
    const eventResult = db
      .prepare(
        "INSERT INTO events (world_id, title, event_type, status, created_by) VALUES (?, ?, 'small', 'open', ?)",
      )
      .run(worldId, 'Test Event', devUser.id);
    eventId = eventResult.lastInsertRowid;
  });

  afterAll(() => {
    if (db) db.close();
    cleanupTestDb(testDbPath);
    delete process.env.DB_PATH;
  });

  describe('Posts', () => {
    it('should return an empty list for an authenticated user when there are no approved posts', async () => {
      const res = await request(app)
        .get(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

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
      expect(getRes.body.data).toHaveLength(0);
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
      expect(getRes.body.data).toHaveLength(1);
      expect(getRes.body.data[0].content).toBe('Dev post content');
    });

    it('should allow supported embedded video URLs on posts', async () => {
      const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      const res = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'Video post content', video_url: videoUrl });

      expect(res.status).toBe(201);
      expect(res.body.video_url).toBe(videoUrl);

      const getRes = await request(app).get(`/api/posts/event/${eventId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.data[0].video_url).toBe(videoUrl);
    });

    it('should reject unsupported embedded video URLs on posts', async () => {
      const res = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          content: 'Bad video',
          video_url: 'https://example.com/watch?v=abc123',
        });

      expect(res.status).toBe(400);
    });

    it('should return approved posts for an authenticated user', async () => {
      await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'Visible to members' });

      const res = await request(app)
        .get(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].liked).toBe(false);
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
      expect(getRes.body.data).toHaveLength(1);
      expect(getRes.body.data[0].content).toBe('Needs approval');
    });

    it('should reject approving a post that is no longer pending', async () => {
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Already handled' });

      const approveRes = await request(app)
        .patch(`/api/posts/${createRes.body.id}/approve`)
        .set('Authorization', `Bearer ${devToken}`);

      expect(approveRes.status).toBe(200);

      const secondApproveRes = await request(app)
        .patch(`/api/posts/${createRes.body.id}/approve`)
        .set('Authorization', `Bearer ${devToken}`);

      expect(secondApproveRes.status).toBe(400);
    });

    it('should allow the author to update post content, image, and video', async () => {
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'Original post' });

      const videoUrl = 'https://www.tiktok.com/@lacebo/video/7123456789012345678';
      const res = await request(app)
        .patch(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          content: 'Updated post',
          image_url: '/uploads/images/post.png',
          video_url: videoUrl,
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: createRes.body.id,
        content: 'Updated post',
        image_url: '/uploads/images/post.png',
        video_url: videoUrl,
      });
    });

    it('should reject post updates from non-authors', async () => {
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'Owned by dev' });

      const res = await request(app)
        .patch(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Player edit' });

      expect(res.status).toBe(403);
    });

    it('should reject empty post updates', async () => {
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'No fields update' });

      const res = await request(app)
        .patch(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('should allow the author to delete a post', async () => {
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Delete my own post' });

      const res = await request(app)
        .delete(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(
        db.prepare('SELECT * FROM posts WHERE id = ?').get(createRes.body.id),
      ).toBeUndefined();
    });

    it('should allow a dev to delete posts in their world', async () => {
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Dev can delete this' });

      const res = await request(app)
        .delete(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${devToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject post deletes from non-authors and non-devs', async () => {
      const otherUser = createTestUser({
        db,
        username: 'other_player',
        email: 'other@test.com',
        password: 'Password123!',
        displayName: 'Other Player',
      });
      const otherToken = createTestToken(otherUser);

      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'Cannot delete this' });

      const res = await request(app)
        .delete(`/api/posts/${createRes.body.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Announcements', () => {
    it('should allow dev to create and fetch announcements', async () => {
      const createRes = await request(app)
        .post(`/api/posts/world/${worldId}/announcements`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'World Notice',
          content: 'Server maintenance tonight.',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.title).toBe('World Notice');
      expect(createRes.body.display_name).toBe(devUser.display_name);

      const listRes = await request(app).get(
        `/api/posts/world/${worldId}/announcements`,
      );
      expect(listRes.status).toBe(200);
      expect(listRes.body).toHaveLength(1);
      expect(listRes.body[0].content).toBe('Server maintenance tonight.');
    });

    it('should reject invalid announcement payloads', async () => {
      const res = await request(app)
        .post(`/api/posts/world/${worldId}/announcements`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ title: 'Missing content' });

      expect(res.status).toBe(400);
    });

    it('should reject announcements from non-dev users', async () => {
      const res = await request(app)
        .post(`/api/posts/world/${worldId}/announcements`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ title: 'Nope', content: 'No access.' });

      expect(res.status).toBe(403);
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
      expect(getRes1.body.data[0].like_count).toBe(1);

      // Unlike
      const unlikeRes = await request(app)
        .post(`/api/posts/${postId}/like`)
        .set('Authorization', `Bearer ${playerToken}`);
      expect(unlikeRes.status).toBe(200);
      expect(unlikeRes.body.liked).toBe(false);

      // Verify like count
      const getRes2 = await request(app).get(`/api/posts/event/${eventId}`);
      expect(getRes2.body.data[0].like_count).toBe(0);
    });

    it('should return pending posts only to dev users', async () => {
      const res = await request(app)
        .get(`/api/posts/world/${worldId}/pending`)
        .set('Authorization', `Bearer ${playerToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow dev to reject a pending post', async () => {
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Reject me' });

      const rejectRes = await request(app)
        .patch(`/api/posts/${createRes.body.id}/reject`)
        .set('Authorization', `Bearer ${devToken}`);

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);
    });

    it('should reject a post that is already rejected', async () => {
      const createRes = await request(app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Reject me twice' });

      const rejectRes = await request(app)
        .patch(`/api/posts/${createRes.body.id}/reject`)
        .set('Authorization', `Bearer ${devToken}`);

      expect(rejectRes.status).toBe(200);

      const secondRejectRes = await request(app)
        .patch(`/api/posts/${createRes.body.id}/reject`)
        .set('Authorization', `Bearer ${devToken}`);

      expect(secondRejectRes.status).toBe(400);
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
      expect(commentRes.body.image_url).toBeNull();

      // Fetch comments
      const getCommentsRes = await request(app).get(
        `/api/posts/${postId}/comments`,
      );
      expect(getCommentsRes.status).toBe(200);
      expect(getCommentsRes.body.data).toHaveLength(1);
      expect(getCommentsRes.body.data[0].content).toBe('This is a comment');
      expect(getCommentsRes.body.data[0].username).toBe(playerUser.username);
    });

    it('should allow user to add comments with an image_url and fetch them', async () => {
      // Add comment with image
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          content: 'Look at this pic',
          image_url: '/uploads/images/comment-pic.png',
        });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body.content).toBe('Look at this pic');
      expect(commentRes.body.image_url).toBe('/uploads/images/comment-pic.png');

      // Fetch comments
      const getCommentsRes = await request(app).get(
        `/api/posts/${postId}/comments`,
      );
      expect(getCommentsRes.status).toBe(200);
      const comments = getCommentsRes.body.data;
      expect(comments.some(c => c.content === 'Look at this pic' && c.image_url === '/uploads/images/comment-pic.png')).toBe(true);
    });

    it('should allow user to add comments with ONLY an image_url and fetch them', async () => {
      // Add comment with only image
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          image_url: '/uploads/images/only-comment-pic.png',
        });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body.content).toBe('');
      expect(commentRes.body.image_url).toBe('/uploads/images/only-comment-pic.png');

      // Fetch comments
      const getCommentsRes = await request(app).get(
        `/api/posts/${postId}/comments`,
      );
      expect(getCommentsRes.status).toBe(200);
      const comments = getCommentsRes.body.data;
      expect(comments.some(c => c.content === '' && c.image_url === '/uploads/images/only-comment-pic.png')).toBe(true);
    });

    it('should allow user to like and unlike a comment', async () => {
      // Create a comment first
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Liking test comment' });
      const commentId = commentRes.body.id;

      // Like comment
      const likeRes = await request(app)
        .post(`/api/posts/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${devToken}`);
      expect(likeRes.status).toBe(200);
      expect(likeRes.body.liked).toBe(true);

      // Fetch comment details to check like_count and liked status
      const getCommentsRes1 = await request(app)
        .get(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${devToken}`);
      const comments1 = getCommentsRes1.body.data;
      const targetComment1 = comments1.find(c => c.id === commentId);
      expect(targetComment1.like_count).toBe(1);
      expect(targetComment1.liked).toBe(true);

      // Unlike comment
      const unlikeRes = await request(app)
        .post(`/api/posts/comments/${commentId}/like`)
        .set('Authorization', `Bearer ${devToken}`);
      expect(unlikeRes.status).toBe(200);
      expect(unlikeRes.body.liked).toBe(false);

      const getCommentsRes2 = await request(app)
        .get(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${devToken}`);
      const comments2 = getCommentsRes2.body.data;
      const targetComment2 = comments2.find(c => c.id === commentId);
      expect(targetComment2.like_count).toBe(0);
      expect(targetComment2.liked).toBe(false);
    });

    it('should allow user to reply to a comment and fetch nested replies', async () => {
      // Create parent comment
      const parentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ content: 'Parent comment' });
      const parentId = parentRes.body.id;

      // Create reply comment
      const replyRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({ content: 'Reply to parent', parent_id: parentId });

      expect(replyRes.status).toBe(201);
      expect(replyRes.body.content).toBe('Reply to parent');
      expect(replyRes.body.parent_id).toBe(parentId);

      // Fetch all comments and verify the nested structure exists
      const getCommentsRes = await request(app).get(
        `/api/posts/${postId}/comments`,
      );
      expect(getCommentsRes.status).toBe(200);
      const comments = getCommentsRes.body.data;
      expect(comments).toHaveLength(2); // parent comment + reply
      const replyComment = comments.find(c => c.id === replyRes.body.id);
      expect(replyComment.parent_id).toBe(parentId);
    });
  });
});
