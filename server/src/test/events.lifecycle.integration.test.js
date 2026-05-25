import request from 'supertest';
import { cleanupTestDb, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('E2.1 Integration: Event Lifecycle', () => {
  let app;
  let db;
  let testDbPath;

  let worldId;
  let eventId;
  let playerToken;
  let devToken;

  const eventPayload = {
    title: 'E2.1 Small Event',
    description: 'Lifecycle integration flow',
    event_type: 'small',
  };

  const statusMap = {
    proposed: 'PENDING',
    approved: 'APPROVED',
    open: 'OPEN',
    closed: 'CLOSED',
  };

  const toLifecycleStatus = (value) => statusMap[value] || String(value).toUpperCase();

  function authedRequest(method, url, token, payload) {
    const req = request(app)[method](url).set('Authorization', `Bearer ${token}`);
    return payload ? req.send(payload) : req;
  }

  function createWorldForLifecycle() {
    const result = db
      .prepare('INSERT INTO worlds (title, description, is_public) VALUES (?, ?, 1)')
      .run('E2.1 Test World', 'World for event lifecycle integration test');

    return Number(result.lastInsertRowid);
  }

  function addApprovedMember(worldIdValue, userId, role) {
    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, ?, 'approved')",
    ).run(worldIdValue, userId, role);
  }

  function getEventStatusFromDb(id) {
    const row = db.prepare('SELECT status FROM events WHERE id = ?').get(id);
    return row?.status;
  }

  async function updateEventStatus(token, status) {
    return authedRequest('patch', `/api/events/${eventId}`, token, { status });
  }

  function expectLifecycleState({ response, expectedStatusCode, expectedStatus }) {
    expect(response.status).toBe(expectedStatusCode);
    expect(response.body.id).toBe(eventId);
    expect(toLifecycleStatus(response.body.status)).toBe(expectedStatus);
    expect(toLifecycleStatus(getEventStatusFromDb(eventId))).toBe(expectedStatus);
  }

  beforeAll(async () => {
    testDbPath = setupTestDb('test-e21-events-lifecycle.db');

    const dbModule = await import('../database/connection.js');
    db = dbModule.default;

    const schemaModule = await import('../database/schema.js');
    schemaModule.initDatabase();

    const appModule = await import('../index.js');
    app = appModule.default;

    const player = createTestUser({
      db,
      username: 'e21_player',
      email: 'e21_player@example.com',
      displayName: 'E2.1 Player',
    });
    playerToken = createTestToken(player);

    const dev = createTestUser({
      db,
      username: 'e21_dev',
      email: 'e21_dev@example.com',
      displayName: 'E2.1 Dev',
    });
    devToken = createTestToken(dev);

    worldId = createWorldForLifecycle();
    addApprovedMember(worldId, player.id, 'player');
    addApprovedMember(worldId, dev.id, 'dev');
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

  test('Step 1: Player creates a small event -> status is PENDING', async () => {
    const createRes = await authedRequest(
      'post',
      `/api/events/world/${worldId}`,
      playerToken,
      eventPayload,
    );

    expect(createRes.status).toBe(201);
    expect(createRes.body).toMatchObject({
      world_id: worldId,
      title: eventPayload.title,
      event_type: 'small',
    });

    eventId = createRes.body.id;
    expect(eventId).toBeDefined();
    expectLifecycleState({
      response: createRes,
      expectedStatusCode: 201,
      expectedStatus: 'PENDING',
    });
  });

  test('Step 2: Dev approves the event -> status is APPROVED', async () => {
    const approveRes = await updateEventStatus(devToken, 'approved');

    expectLifecycleState({
      response: approveRes,
      expectedStatusCode: 200,
      expectedStatus: 'APPROVED',
    });
  });

  test('Step 3: Dev opens the event -> status is OPEN', async () => {
    const openRes = await updateEventStatus(devToken, 'open');

    expectLifecycleState({
      response: openRes,
      expectedStatusCode: 200,
      expectedStatus: 'OPEN',
    });
  });

  test('Step 4: Dev closes the event -> status is CLOSED', async () => {
    const closeRes = await updateEventStatus(devToken, 'closed');

    expectLifecycleState({
      response: closeRes,
      expectedStatusCode: 200,
      expectedStatus: 'CLOSED',
    });
  });
});