import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import {
  createEventsTestContext,
  expectCreatedEvent,
  expectEventTitles,
} from './helpers/events.js';

describe('Events API Integration Tests', () => {
  let app;
  let db;
  let testDbPath;
  let events;

  beforeAll(async () => {
    testDbPath = setupTestDb();

    const dbModule = await import('../database/connection.js');
    db = dbModule.default;

    const schemaModule = await import('../database/schema.js');
    schemaModule.initDatabase();

    const appModule = await import('../index.js');
    app = appModule.default;
    events = createEventsTestContext(db);
  });

  beforeEach(() => {
    resetDatabase(db);
  });

  afterAll(() => {
    if (db) db.close();
    cleanupTestDb(testDbPath);
    delete process.env.DB_PATH;
  });

  test.each([
    {
      caseName: 'dev can create big event with open status',
      userRole: 'dev',
      payload: {
        title: 'Great War',
        description: 'A major world event',
        event_type: 'big',
      },
      expectedStatus: 201,
      expectedBody: {
        title: 'Great War',
        event_type: 'big',
        status: 'open',
      },
    },
    {
      caseName: 'player cannot create big event',
      userRole: 'player',
      payload: {
        title: 'Forbidden Big Event',
        event_type: 'big',
      },
      expectedStatus: 403,
      expectedBody: { error: 'Only devs can create big events' },
    },
    {
      caseName: 'player creates small event as proposed',
      userRole: 'player',
      payload: {
        title: 'Small Tavern Story',
        event_type: 'small',
      },
      expectedStatus: 201,
      expectedBody: {
        title: 'Small Tavern Story',
        event_type: 'small',
        status: 'proposed',
      },
    },
  ])(
    'A2.1: POST /api/events/world/:worldId - $caseName',
    async ({ userRole, payload, expectedStatus, expectedBody }) => {
      const { worldId, devToken, playerToken } =
        events.createWorldAndMemberships();
      const token = userRole === 'dev' ? devToken : playerToken;

      const res = await events.postEvent(app, worldId, token, payload);

      expectCreatedEvent(res, {
        statusCode: expectedStatus,
        body:
          expectedStatus === 201
            ? { world_id: worldId, ...expectedBody }
            : expectedBody,
      });
    },
  );

  test('A2.2: GET /api/events/world/:worldId - returns only approved/open/closed timeline events', async () => {
    const { worldId, dev } = events.createWorldAndMemberships();

    const seededEvents = [
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
    ];

    seededEvents.forEach((event) => {
      events.insertEvent(worldId, dev.id, event);
    });

    const res = await request(app).get(`/api/events/world/${worldId}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expectEventTitles(res.body, [
      'Approved Event',
      'Open Event',
      'Closed Event',
    ]);
  });

  test.each([
    {
      caseName: 'dev can read proposed events',
      userRole: 'dev',
      expectedStatus: 200,
      setup(worldId, dev) {
        events.insertEvent(worldId, dev.id, {
          title: 'Proposed Story',
          eventType: 'small',
          status: 'proposed',
        });
      },
      assert(response) {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].title).toBe('Proposed Story');
      },
    },
    {
      caseName: 'non-dev is forbidden',
      userRole: 'player',
      expectedStatus: 403,
      setup() {},
      assert(response) {
        expect(response.body).toEqual({ error: 'Dev only' });
      },
    },
  ])(
    'A2.3: GET /api/events/world/:worldId/proposed - $caseName',
    async ({ userRole, expectedStatus, setup, assert }) => {
      const { worldId, dev, devToken, playerToken } =
        events.createWorldAndMemberships();
      setup(worldId, dev);
      const token = userRole === 'dev' ? devToken : playerToken;

      const res = await events.getProposed(app, worldId, token);

      expect(res.status).toBe(expectedStatus);
      assert(res);
    },
  );

  test('A2.4: GET /api/events/:eventId - returns event detail', async () => {
    const { worldId, dev } = events.createWorldAndMemberships();

    const eventId = events.insertEvent(worldId, dev.id, {
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

  test.each([
    {
      caseName: 'dev can update status and metadata',
      userRole: 'dev',
      expectedStatus: 200,
      setup(worldId, dev) {
        return events.insertEvent(worldId, dev.id, {
          title: 'Before Update',
          description: 'old',
          eventType: 'small',
          status: 'proposed',
        });
      },
      payload: {
        status: 'approved',
        title: 'After Update',
        description: 'new',
      },
      assert(response, eventId) {
        expect(response.body).toMatchObject({
          id: eventId,
          status: 'approved',
          title: 'After Update',
          description: 'new',
        });
      },
    },
    {
      caseName: 'non-dev cannot update',
      userRole: 'player',
      expectedStatus: 403,
      setup(worldId, dev) {
        return events.insertEvent(worldId, dev.id, {
          title: 'Locked Event',
          eventType: 'small',
          status: 'proposed',
        });
      },
      payload: {
        status: 'approved',
      },
      assert(response) {
        expect(response.body).toEqual({ error: 'Dev only' });
      },
    },
  ])(
    'A2.5: PATCH /api/events/:eventId - $caseName',
    async ({ userRole, expectedStatus, setup, payload, assert }) => {
      const { worldId, dev, devToken, playerToken } =
        events.createWorldAndMemberships();
      const eventId = setup(worldId, dev);
      const token = userRole === 'dev' ? devToken : playerToken;

      const res = await events.patchEvent(app, eventId, token, payload);

      expect(res.status).toBe(expectedStatus);
      assert(res, eventId);
    },
  );
});
