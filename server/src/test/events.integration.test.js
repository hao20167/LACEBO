import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('Events API Integration Tests', () => {
  const AUTH_HEADER = 'Authorization';
  let userSeq = 0;
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
    delete process.env.DB_PATH;
  });

  function createWorld() {
    const worldResult = db
      .prepare('INSERT INTO worlds (title, description, is_public) VALUES (?, ?, 1)')
      .run('Events Test World', 'World used for events route tests');
    return Number(worldResult.lastInsertRowid);
  }

  function addMember(worldId, userId, role) {
    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, ?, 'approved', 0)",
    ).run(worldId, userId, role);
  }

  function insertEvent(worldId, creatorId, fields = {}) {
    const event = {
      title: 'Default Event',
      description: '',
      eventType: 'small',
      status: 'proposed',
      startDate: null,
      endDate: null,
      ...fields,
    };

    const result = db
      .prepare(
        'INSERT INTO events (world_id, title, description, event_type, status, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        worldId,
        event.title,
        event.description,
        event.eventType,
        event.status,
        event.startDate,
        event.endDate,
        creatorId,
      );

    return Number(result.lastInsertRowid);
  }

  function postEvent(worldId, token, payload) {
    return request(app)
      .post(`/api/events/world/${worldId}`)
      .set(AUTH_HEADER, `Bearer ${token}`)
      .send(payload);
  }

  function getProposed(worldId, token) {
    return request(app)
      .get(`/api/events/world/${worldId}/proposed`)
      .set(AUTH_HEADER, `Bearer ${token}`);
  }

  function patchEvent(eventId, token, payload) {
    return request(app)
      .patch(`/api/events/${eventId}`)
      .set(AUTH_HEADER, `Bearer ${token}`)
      .send(payload);
  }

  function createWorldAndMemberships() {
    userSeq += 1;
    const stamp = `u${Date.now()}_${userSeq}`;
    const dev = createTestUser({
      db,
      username: `dev_${stamp}`,
      email: `dev_${stamp}@example.com`,
      displayName: 'World Dev',
    });
    const player = createTestUser({
      db,
      username: `player_${stamp}`,
      email: `player_${stamp}@example.com`,
      displayName: 'World Player',
    });

    const worldId = createWorld();
    addMember(worldId, dev.id, 'dev');
    addMember(worldId, player.id, 'player');

    return {
      worldId,
      dev,
      player,
      devToken: createTestToken(dev),
      playerToken: createTestToken(player),
    };
  }

  test('A2.1: POST /api/events/world/:worldId - dev can create big event with open status', async () => {
    const { worldId, devToken } = createWorldAndMemberships();

    const res = await postEvent(worldId, devToken, {
      title: 'Great War',
      description: 'A major world event',
      event_type: 'big',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      world_id: worldId,
      title: 'Great War',
      event_type: 'big',
      status: 'open',
    });
  });

  test('A2.1: POST /api/events/world/:worldId - player cannot create big event', async () => {
    const { worldId, playerToken } = createWorldAndMemberships();

    const res = await postEvent(worldId, playerToken, {
      title: 'Forbidden Big Event',
      event_type: 'big',
    });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only devs can create big events' });
  });

  test('A2.1: POST /api/events/world/:worldId - player creates small event as proposed', async () => {
    const { worldId, playerToken } = createWorldAndMemberships();

    const res = await postEvent(worldId, playerToken, {
      title: 'Small Tavern Story',
      event_type: 'small',
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('proposed');
    expect(res.body.event_type).toBe('small');
  });

  test('A2.2: GET /api/events/world/:worldId - returns only approved/open/closed timeline events', async () => {
    const { worldId, dev } = createWorldAndMemberships();

    [
      {
        title: 'Approved Event',
        eventType: 'small',
        status: 'approved',
        startDate: '2026-01-01',
      },
      {
        title: 'Open Event',
        eventType: 'big',
        status: 'open',
        startDate: '2026-01-02',
      },
      {
        title: 'Closed Event',
        eventType: 'small',
        status: 'closed',
        startDate: '2026-01-03',
      },
      {
        title: 'Proposed Event',
        eventType: 'small',
        status: 'proposed',
        startDate: '2026-01-04',
      },
    ].forEach((event) => {
      insertEvent(worldId, dev.id, event);
    });

    const res = await request(app).get(`/api/events/world/${worldId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((e) => e.title === 'Proposed Event')).toBe(false);
    expect(res.body.some((e) => e.title === 'Approved Event')).toBe(true);
    expect(res.body.some((e) => e.title === 'Open Event')).toBe(true);
    expect(res.body.some((e) => e.title === 'Closed Event')).toBe(true);
  });

  test('A2.3: GET /api/events/world/:worldId/proposed - dev can read proposed events', async () => {
    const { worldId, dev, devToken } = createWorldAndMemberships();

    insertEvent(worldId, dev.id, {
      title: 'Proposed Story',
      eventType: 'small',
      status: 'proposed',
    });

    const res = await getProposed(worldId, devToken);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Proposed Story');
  });

  test('A2.3: GET /api/events/world/:worldId/proposed - non-dev is forbidden', async () => {
    const { worldId, playerToken } = createWorldAndMemberships();

    const res = await getProposed(worldId, playerToken);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Dev only' });
  });

  test('A2.4: GET /api/events/:eventId - returns event detail', async () => {
    const { worldId, dev } = createWorldAndMemberships();

    const eventId = insertEvent(worldId, dev.id, {
      title: 'Detail Event',
      description: 'Event details here',
      eventType: 'small',
      status: 'approved',
    });
    const res = await request(app).get(`/api/events/${eventId}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Detail Event');
    expect(res.body.creator_name).toBe(dev.username);
  });

  test('A2.4: GET /api/events/:eventId - returns 404 when not found', async () => {
    const res = await request(app).get('/api/events/99999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Event not found' });
  });

  test('A2.5: PATCH /api/events/:eventId - dev can update status and metadata', async () => {
    const { worldId, dev, devToken } = createWorldAndMemberships();

    const eventId = insertEvent(worldId, dev.id, {
      title: 'Before Update',
      description: 'old',
      eventType: 'small',
      status: 'proposed',
    });

    const res = await patchEvent(eventId, devToken, {
      status: 'approved',
      title: 'After Update',
      description: 'new',
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: eventId,
      status: 'approved',
      title: 'After Update',
      description: 'new',
    });
  });

  test('A2.5: PATCH /api/events/:eventId - non-dev cannot update', async () => {
    const { worldId, dev, playerToken } = createWorldAndMemberships();

    const eventId = insertEvent(worldId, dev.id, {
      title: 'Locked Event',
      eventType: 'small',
      status: 'proposed',
    });

    const res = await patchEvent(eventId, playerToken, { status: 'approved' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Dev only' });
  });
});
