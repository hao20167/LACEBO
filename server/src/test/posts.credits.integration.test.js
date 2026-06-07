import request from 'supertest';
import { cleanupTestDb, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('E2.2 Integration: Post Interactions and Credit Calculation', () => {
  let app;
  let db;
  let testDbPath;

  let worldId;
  let eventId;
  let author;
  let interactor;
  let authorToken;
  let interactorToken;

  let postId;
  let commentId;

  const initialCredits = {
    author: 5,
    interactor: 3,
  };

  const postPayload = {
    content: 'E2.2 author post content',
  };

  const commentPayload = {
    content: 'E2.2 interaction comment',
  };

  function executeRequest(method, url, token, body) {
    const req = request(app)[method](url);
    const withAuth = token ? req.set('Authorization', `Bearer ${token}`) : req;
    return body ? withAuth.send(body) : withAuth;
  }

  function getMemberCredits(userId) {
    const row = db
      .prepare(
        'SELECT credits FROM world_members WHERE world_id = ? AND user_id = ?',
      )
      .get(worldId, userId);
    return row ? row.credits : null;
  }

  function expectCredits({ authorCredits, interactorCredits }) {
    expect(getMemberCredits(author.id)).toBe(authorCredits);
    expect(getMemberCredits(interactor.id)).toBe(interactorCredits);
  }

  beforeAll(async () => {
    testDbPath = setupTestDb('test-e22-posts-credits.db');

    const dbModule = await import('../database/connection.js');
    db = dbModule.default;

    const schemaModule = await import('../database/schema.js');
    schemaModule.initDatabase();

    const appModule = await import('../index.js');
    app = appModule.default;

    author = createTestUser({
      db,
      username: 'e22_author',
      email: 'e22_author@example.com',
      displayName: 'E2.2 Author',
    });
    authorToken = createTestToken(author);

    interactor = createTestUser({
      db,
      username: 'e22_interactor',
      email: 'e22_interactor@example.com',
      displayName: 'E2.2 Interactor',
    });
    interactorToken = createTestToken(interactor);

    const worldResult = db
      .prepare(
        'INSERT INTO worlds (title, description, is_public) VALUES (?, ?, 1)',
      )
      .run('E2.2 World', 'World for post interaction credits');
    worldId = Number(worldResult.lastInsertRowid);

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, 'dev', 'approved', ?)",
    ).run(worldId, author.id, initialCredits.author);

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, 'player', 'approved', ?)",
    ).run(worldId, interactor.id, initialCredits.interactor);

    const eventResult = db
      .prepare(
        "INSERT INTO events (world_id, title, event_type, status, created_by) VALUES (?, ?, 'small', 'open', ?)",
      )
      .run(worldId, 'E2.2 Open Event', author.id);
    eventId = Number(eventResult.lastInsertRowid);
  });

  afterAll(() => {
    if (db) {
      db.exec(`
        DELETE FROM likes;
        DELETE FROM comments;
        DELETE FROM posts;
        DELETE FROM events;
        DELETE FROM announcements;
        DELETE FROM world_members;
        DELETE FROM worlds;
        DELETE FROM users;
        DELETE FROM sqlite_sequence;
      `);
      db.close();
    }

    cleanupTestDb(testDbPath);
    delete process.env.DB_PATH;
  });

  test('Step 1: Author creates a post in open event and credits are updated', async () => {
    const createPostRes = await executeRequest(
      'post',
      `/api/posts/event/${eventId}`,
      authorToken,
      postPayload,
    );

    expect(createPostRes.status).toBe(201);
    expect(createPostRes.body).toMatchObject({
      event_id: eventId,
      world_id: worldId,
      user_id: author.id,
      content: postPayload.content,
      status: 'approved',
    });

    postId = createPostRes.body.id;
    expect(postId).toBeDefined();

    expectCredits({
      authorCredits: initialCredits.author + 10,
      interactorCredits: initialCredits.interactor,
    });
  });

  test('Step 2: Interactor likes author post and credits are updated', async () => {
    const likeRes = await executeRequest(
      'post',
      `/api/posts/${postId}/like`,
      interactorToken,
    );

    expect(likeRes.status).toBe(200);
    expect(likeRes.body).toEqual({ liked: true });

    const likedPostRes = await executeRequest(
      'get',
      `/api/posts/event/${eventId}`,
      interactorToken,
    );
    expect(likedPostRes.status).toBe(200);
    expect(Array.isArray(likedPostRes.body.data)).toBe(true);
    expect(likedPostRes.body.data).toHaveLength(1);
    expect(likedPostRes.body.data[0]).toMatchObject({
      id: postId,
      like_count: 1,
      comment_count: 0,
      liked: true,
    });

    expectCredits({
      authorCredits: initialCredits.author + 11,
      interactorCredits: initialCredits.interactor,
    });
  });

  test('Step 3: Interactor comments on author post and credits are updated', async () => {
    const commentRes = await executeRequest(
      'post',
      `/api/posts/${postId}/comments`,
      interactorToken,
      commentPayload,
    );

    expect(commentRes.status).toBe(201);
    expect(commentRes.body).toMatchObject({
      post_id: postId,
      user_id: interactor.id,
      content: commentPayload.content,
      username: interactor.username,
      display_name: interactor.display_name,
    });
    commentId = commentRes.body.id;
    expect(commentId).toBeDefined();

    const commentsRes = await executeRequest(
      'get',
      `/api/posts/${postId}/comments`,
    );
    expect(commentsRes.status).toBe(200);
    expect(Array.isArray(commentsRes.body.data)).toBe(true);
    expect(commentsRes.body.data).toHaveLength(1);
    expect(commentsRes.body.data[0]).toMatchObject({
      id: commentId,
      post_id: postId,
      user_id: interactor.id,
      content: commentPayload.content,
    });

    expectCredits({
      authorCredits: initialCredits.author + 11,
      interactorCredits: initialCredits.interactor + 2,
    });
  });
});
