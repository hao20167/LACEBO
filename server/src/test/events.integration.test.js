import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import { createTestToken, createTestUser } from './helpers/auth.js';

describe('Events API Integration Tests', () => {
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

  function createWorldAndMemberships() {
    const stamp = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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

    const worldResult = db
      .prepare('INSERT INTO worlds (title, description, is_public) VALUES (?, ?, 1)')
      .run('Events Test World', 'World used for events route tests');
    const worldId = Number(worldResult.lastInsertRowid);

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, 'dev', 'approved', 0)",
    ).run(worldId, dev.id);

    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, 'player', 'approved', 0)",
    ).run(worldId, player.id);

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

    const res = await request(app)
      .post(`/api/events/world/${worldId}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({
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

    const res = await request(app)
      .post(`/api/events/world/${worldId}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ title: 'Forbidden Big Event', event_type: 'big' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Only devs can create big events' });
  });

  test('A2.1: POST /api/events/world/:worldId - player creates small event as proposed', async () => {
    const { worldId, playerToken } = createWorldAndMemberships();

    const res = await request(app)
      .post(`/api/events/world/${worldId}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ title: 'Small Tavern Story', event_type: 'small' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('proposed');
    expect(res.body.event_type).toBe('small');
  });

  test('A2.2: GET /api/events/world/:worldId - returns only approved/open/closed timeline events', async () => {
    const { worldId, dev } = createWorldAndMemberships();

    db.prepare(
      "INSERT INTO events (world_id, title, event_type, status, created_by, start_date) VALUES (?, 'Approved Event', 'small', 'approved', ?, '2026-01-01')",
    ).run(worldId, dev.id);
    db.prepare(
      "INSERT INTO events (world_id, title, event_type, status, created_by, start_date) VALUES (?, 'Open Event', 'big', 'open', ?, '2026-01-02')",
    ).run(worldId, dev.id);
    db.prepare(
      "INSERT INTO events (world_id, title, event_type, status, created_by, start_date) VALUES (?, 'Closed Event', 'small', 'closed', ?, '2026-01-03')",
    ).run(worldId, dev.id);
    db.prepare(
      "INSERT INTO events (world_id, title, event_type, status, created_by, start_date) VALUES (?, 'Proposed Event', 'small', 'proposed', ?, '2026-01-04')",
    ).run(worldId, dev.id);

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

    db.prepare(
      "INSERT INTO events (world_id, title, event_type, status, created_by) VALUES (?, 'Proposed Story', 'small', 'proposed', ?)",
    ).run(worldId, dev.id);

    const res = await request(app)
      .get(`/api/events/world/${worldId}/proposed`)
      .set('Authorization', `Bearer ${devToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Proposed Story');
  });

  test('A2.3: GET /api/events/world/:worldId/proposed - non-dev is forbidden', async () => {
    const { worldId, playerToken } = createWorldAndMemberships();

    const res = await request(app)
      .get(`/api/events/world/${worldId}/proposed`)
      .set('Authorization', `Bearer ${playerToken}`);

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Dev only' });
  });

  test('A2.4: GET /api/events/:eventId - returns event detail', async () => {
    const { worldId, dev } = createWorldAndMemberships();

    const eventResult = db
      .prepare(
        "INSERT INTO events (world_id, title, description, event_type, status, created_by) VALUES (?, 'Detail Event', 'Event details here', 'small', 'approved', ?)",
      )
      .run(worldId, dev.id);

    const eventId = Number(eventResult.lastInsertRowid);
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

    const eventResult = db
      .prepare(
        "INSERT INTO events (world_id, title, description, event_type, status, created_by) VALUES (?, 'Before Update', 'old', 'small', 'proposed', ?)",
      )
      .run(worldId, dev.id);
    const eventId = Number(eventResult.lastInsertRowid);

    const res = await request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${devToken}`)
      .send({
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

    const eventResult = db
      .prepare(
        "INSERT INTO events (world_id, title, event_type, status, created_by) VALUES (?, 'Locked Event', 'small', 'proposed', ?)",
      )
      .run(worldId, dev.id);
    const eventId = Number(eventResult.lastInsertRowid);

    const res = await request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${playerToken}`)
      .send({ status: 'approved' });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Dev only' });
  });
});
