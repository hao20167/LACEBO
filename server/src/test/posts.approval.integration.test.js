import request from 'supertest';
import { cleanupTestDb, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('E2.3 Integration: Post Approval and Dev-mediated Credit Reward', () => {
  let app;
  let db;
  let testDbPath;

  let worldId;
  let eventId;
  let player;
  let dev;
  let playerToken;
  let devToken;
  let playerInitialCredits;
  let postId;

  function sendHttpRequest(method, url, token, body) {
    const requestBuilder = request(app)[method](url);
    const authorizedRequest = token
      ? requestBuilder.set('Authorization', `Bearer ${token}`)
      : requestBuilder;

    return body ? authorizedRequest.send(body) : authorizedRequest;
  }

  function getPlayerCredits() {
    const row = db
      .prepare(
        'SELECT credits FROM world_members WHERE world_id = ? AND user_id = ?',
      )
      .get(worldId, player.id);

    return row?.credits;
  }

  beforeAll(async () => {
    testDbPath = setupTestDb('test-e23-post-approval.db');

    const dbModule = await import('../database/connection.js');
    db = dbModule.default;

    const schemaModule = await import('../database/schema.js');
    schemaModule.initDatabase();

    const appModule = await import('../index.js');
    app = appModule.default;

    player = createTestUser({
      db,
      username: 'e23_player',
      email: 'e23_player@example.com',
      displayName: 'E2.3 Player',
    });
    playerToken = createTestToken(player);

    dev = createTestUser({
      db,
      username: 'e23_dev',
      email: 'e23_dev@example.com',
      displayName: 'E2.3 Dev',
    });
    devToken = createTestToken(dev);

    const worldResult = db
      .prepare('INSERT INTO worlds (title, description, is_public) VALUES (?, ?, 1)')
      .run('E2.3 World', 'World for post approval credit test');
    worldId = Number(worldResult.lastInsertRowid);

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, 'player', 'approved', ?)",
    ).run(worldId, player.id, 12);

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, 'dev', 'approved', ?)",
    ).run(worldId, dev.id, 0);

    playerInitialCredits = getPlayerCredits();

    const eventResult = db
      .prepare(
        "INSERT INTO events (world_id, title, event_type, status, created_by) VALUES (?, ?, 'small', 'open', ?)",
      )
      .run(worldId, 'E2.3 Open Event', dev.id);
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

  test('Player creates a pending post, Dev approves it, and Player receives 10 credits', async () => {
    const createRes = await sendHttpRequest(
      'post',
      `/api/posts/event/${eventId}`,
      playerToken,
      { content: 'E2.3 pending approval post' },
    );

    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({
      event_id: eventId,
      world_id: worldId,
      user_id: player.id,
      content: 'E2.3 pending approval post',
      status: 'pending',
    });
    expect(createRes.body.id).toBeDefined();
    postId = createRes.body.id;

    expect(getPlayerCredits()).toBe(playerInitialCredits);

    const approveRes = await sendHttpRequest(
      'patch',
      `/api/posts/${postId}/approve`,
      devToken,
    );

    expect(approveRes.status).toBe(200);
    expect(approveRes.body).toEqual({ success: true });

    const approvedPostRes = await sendHttpRequest('get', `/api/posts/event/${eventId}`);

    expect(approvedPostRes.status).toBe(200);
    expect(Array.isArray(approvedPostRes.body)).toBe(true);
    expect(approvedPostRes.body).toHaveLength(1);
    expect(approvedPostRes.body[0]).toMatchObject({
      id: postId,
      event_id: eventId,
      user_id: player.id,
      content: 'E2.3 pending approval post',
      status: 'approved',
      like_count: 0,
      comment_count: 0,
    });

    expect(getPlayerCredits()).toBe(playerInitialCredits + 10);
  });
});