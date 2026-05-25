import request from 'supertest';
import { cleanupTestDb, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('E2.4 Integration: Role Authorization', () => {
  let app;
  let db;
  let testDbPath;

  let worldId;
  let openEventId;
  let pendingPostId;
  let devToken;
  let playerToken;

  const endpoints = {
    bigEvent: `/api/events/world`,
    postApprove: `/api/posts`,
    eventUpdate: `/api/events`,
  };

  const payloads = {
    bigEvent: {
      title: 'E2.4 Big Event',
      description: 'RBAC test big event',
      event_type: 'big',
    },
    approveSmallEvent: {
      status: 'approved',
    },
  };

  function sendHttpRequest(method, url, token, body) {
    const baseRequest = request(app)[method](url);
    const authorizedRequest = token
      ? baseRequest.set('Authorization', `Bearer ${token}`)
      : baseRequest;

    return body ? authorizedRequest.send(body) : authorizedRequest;
  }

  function testAuthorization(method, url, token, body, expectedStatus) {
    return sendHttpRequest(method, url, token, body).then((response) => {
      expect(response.status).toBe(expectedStatus);
      return response;
    });
  }

  function createApprovedMember(worldIdValue, userId, role) {
    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, ?, 'approved', 0)",
    ).run(worldIdValue, userId, role);
  }

  beforeAll(async () => {
    testDbPath = setupTestDb('test-e24-rbac.db');

    const dbModule = await import('../database/connection.js');
    db = dbModule.default;

    const schemaModule = await import('../database/schema.js');
    schemaModule.initDatabase();

    const appModule = await import('../index.js');
    app = appModule.default;

    const dev = createTestUser({
      db,
      username: 'e24_dev',
      email: 'e24_dev@example.com',
      displayName: 'E2.4 Dev',
    });
    devToken = createTestToken(dev);

    const player = createTestUser({
      db,
      username: 'e24_player',
      email: 'e24_player@example.com',
      displayName: 'E2.4 Player',
    });
    playerToken = createTestToken(player);

    const worldResult = db
      .prepare('INSERT INTO worlds (title, description, is_public) VALUES (?, ?, 1)')
      .run('E2.4 World', 'World for RBAC authorization checks');
    worldId = Number(worldResult.lastInsertRowid);

    createApprovedMember(worldId, dev.id, 'dev');
    createApprovedMember(worldId, player.id, 'player');

    const openEventResult = db
      .prepare(
        "INSERT INTO events (world_id, title, event_type, status, created_by) VALUES (?, ?, 'small', 'open', ?)",
      )
      .run(worldId, 'E2.4 Open Event', dev.id);
    openEventId = Number(openEventResult.lastInsertRowid);

    const pendingPostResult = db
      .prepare(
        'INSERT INTO posts (event_id, world_id, user_id, content, status) VALUES (?, ?, ?, ?, ?)',
      )
      .run(openEventId, worldId, player.id, 'E2.4 Pending Post', 'pending');
    pendingPostId = Number(pendingPostResult.lastInsertRowid);
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
    cleanupTestDb(testDbPath);
    delete process.env.DB_PATH;
  });

  test('Action A: Create a big event - dev allowed, player forbidden', async () => {
    const devRes = await testAuthorization(
      'post',
      `${endpoints.bigEvent}/${worldId}`,
      devToken,
      payloads.bigEvent,
      201,
    );

    expect(devRes.body).toMatchObject({
      world_id: worldId,
      title: payloads.bigEvent.title,
      event_type: 'big',
      status: 'open',
    });

    await testAuthorization(
      'post',
      `${endpoints.bigEvent}/${worldId}`,
      playerToken,
      payloads.bigEvent,
      403,
    );
  });

  test('Action B: Approve a post - dev allowed, player forbidden', async () => {
    const devRes = await testAuthorization(
      'patch',
      `${endpoints.postApprove}/${pendingPostId}/approve`,
      devToken,
      undefined,
      200,
    );

    expect(devRes.body).toEqual({ success: true });

    await testAuthorization(
      'patch',
      `${endpoints.postApprove}/${pendingPostId}/approve`,
      playerToken,
      undefined,
      403,
    );
  });

  test('Action C: Approve a small event proposal - dev allowed, player forbidden', async () => {
    const playerProposalRes = await testAuthorization(
      'post',
      `${endpoints.eventUpdate}/world/${worldId}`,
      playerToken,
      {
        title: 'E2.4 Player Proposal',
        event_type: 'small',
      },
      201,
    );

    const proposalId = playerProposalRes.body.id;

    const devRes = await testAuthorization(
      'patch',
      `${endpoints.eventUpdate}/${proposalId}`,
      devToken,
      payloads.approveSmallEvent,
      200,
    );

    expect(devRes.body).toMatchObject({
      id: proposalId,
      status: 'approved',
    });

    await testAuthorization(
      'patch',
      `${endpoints.eventUpdate}/${proposalId}`,
      playerToken,
      payloads.approveSmallEvent,
      403,
    );
  });
});