import request from 'supertest';
import { cleanupTestDb, resetDatabase, setupTestDb } from './helpers/testDb.js';
import { createTestUser, createTestToken } from './helpers/auth.js';

describe('E2.1 Integration: Event Lifecycle (proposed → approved → open → closed)', () => {
  let app;
  let db;
  let testDbPath;

  beforeAll(async () => {
    testDbPath = setupTestDb('e21-event-lifecycle');

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
    if (db) {
      db.close();
    }
    cleanupTestDb(testDbPath);
    delete process.env.DB_PATH;
  });

  describe('Event Creation with Role-Based Status', () => {
    test('player creates small event → status should be "proposed"', async () => {
      // Setup: create world and add player
      const dev = createTestUser({
        db,
        username: 'e21_dev_creator',
        email: 'e21_dev@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev',
      });
      const devToken = createTestToken(dev);

      // Create world as dev
      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Event Lifecycle World',
          description: 'Test world for event lifecycle',
        });

      const worldId = worldRes.body.id;
      expect(worldId).toBeDefined();

      // Create player and add to world
      const player = createTestUser({
        db,
        username: 'e21_player',
        email: 'e21_player@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Player',
      });
      const playerToken = createTestToken(player);

      // Player joins world
      await request(app)
        .post(`/api/worlds/${worldId}/join`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({});

      // Dev approves player
      const membersRes = await request(app)
        .get(`/api/worlds/${worldId}/members/pending`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({});

      const playerId = membersRes.body[0].id;
      await request(app)
        .patch(`/api/worlds/${worldId}/members/${playerId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'approved' });

      // Player creates small event
      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          title: 'Player Small Event',
          description: 'Small event created by player',
          event_type: 'small',
          start_date: '2026-05-20T10:00:00Z',
          end_date: '2026-05-20T12:00:00Z',
        });

      expect(eventRes.status).toBe(201);
      expect(eventRes.body.id).toBeDefined();
      expect(eventRes.body.status).toBe('proposed');
      expect(eventRes.body.title).toBe('Player Small Event');
      expect(eventRes.body.created_by).toBe(player.id);
    });

    test('dev creates small event → status should be "approved"', async () => {
      const dev = createTestUser({
        db,
        username: 'e21_dev_small',
        email: 'e21_dev_small@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Small',
      });
      const devToken = createTestToken(dev);

      // Create world
      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Dev Small Event World',
          description: 'Test world',
        });

      const worldId = worldRes.body.id;

      // Dev creates small event
      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'Dev Small Event',
          description: 'Small event by dev',
          event_type: 'small',
        });

      expect(eventRes.status).toBe(201);
      expect(eventRes.body.status).toBe('approved');
      expect(eventRes.body.event_type).toBe('small');
    });

    test('dev creates big event → status should be "open"', async () => {
      const dev = createTestUser({
        db,
        username: 'e21_dev_big',
        email: 'e21_dev_big@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Big',
      });
      const devToken = createTestToken(dev);

      // Create world
      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Dev Big Event World',
          description: 'Test world',
        });

      const worldId = worldRes.body.id;

      // Dev creates big event
      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'Dev Big Event',
          description: 'Big event by dev',
          event_type: 'big',
        });

      expect(eventRes.status).toBe(201);
      expect(eventRes.body.status).toBe('open');
      expect(eventRes.body.event_type).toBe('big');
    });

    test('player cannot create big event → 403 Forbidden', async () => {
      const dev = createTestUser({
        db,
        username: 'e21_dev_forbid',
        email: 'e21_dev_forbid@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Forbid',
      });
      const devToken = createTestToken(dev);

      // Create world
      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Forbid World',
          description: 'Test world',
        });

      const worldId = worldRes.body.id;

      // Create player
      const player = createTestUser({
        db,
        username: 'e21_player_forbid',
        email: 'e21_player_forbid@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Player Forbid',
      });
      const playerToken = createTestToken(player);

      // Player joins world
      await request(app)
        .post(`/api/worlds/${worldId}/join`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({});

      // Dev approves player
      const membersRes = await request(app)
        .get(`/api/worlds/${worldId}/members/pending`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({});

      const playerId = membersRes.body[0].id;
      await request(app)
        .patch(`/api/worlds/${worldId}/members/${playerId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'approved' });

      // Player tries to create big event - should fail
      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          title: 'Player Big Event',
          description: 'Big event attempt by player',
          event_type: 'big',
        });

      expect(eventRes.status).toBe(403);
      expect(eventRes.body.error).toContain('Only devs can create big events');
    });
  });

  describe('Event Status Transitions', () => {
    test('full lifecycle: proposed → approved → open → closed', async () => {
      // Setup
      const dev = createTestUser({
        db,
        username: 'e21_dev_lifecycle',
        email: 'e21_dev_lifecycle@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Lifecycle',
      });
      const devToken = createTestToken(dev);

      // Create world
      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Lifecycle World',
          description: 'World for full lifecycle test',
        });

      const worldId = worldRes.body.id;

      // Create player
      const player = createTestUser({
        db,
        username: 'e21_player_lifecycle',
        email: 'e21_player_lifecycle@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Player Lifecycle',
      });
      const playerToken = createTestToken(player);

      // Player joins world
      await request(app)
        .post(`/api/worlds/${worldId}/join`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({});

      // Dev approves player
      const membersRes = await request(app)
        .get(`/api/worlds/${worldId}/members/pending`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({});

      const playerId = membersRes.body[0].id;
      await request(app)
        .patch(`/api/worlds/${worldId}/members/${playerId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'approved' });

      // Step 1: Player creates small event → proposed
      const createRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          title: 'Lifecycle Test Event',
          description: 'Full lifecycle test',
          event_type: 'small',
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.status).toBe('proposed');

      const eventId = createRes.body.id;

      // Step 2: Dev approves event → proposed to approved
      const approveRes = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'approved' });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.status).toBe('approved');

      // Step 3: Dev opens event → approved to open
      const openRes = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'open' });

      expect(openRes.status).toBe(200);
      expect(openRes.body.status).toBe('open');

      // Step 4: Dev closes event → open to closed
      const closeRes = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'closed' });

      expect(closeRes.status).toBe(200);
      expect(closeRes.body.status).toBe('closed');

      // Verify final state
      const getRes = await request(app)
        .get(`/api/events/${eventId}`)
        .send({});

      expect(getRes.status).toBe(200);
      expect(getRes.body.status).toBe('closed');
      expect(getRes.body.title).toBe('Lifecycle Test Event');
    });

    test('only dev can transition event status → non-dev returns 403', async () => {
      // Setup: dev creates world and event
      const dev = createTestUser({
        db,
        username: 'e21_dev_perm',
        email: 'e21_dev_perm@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Perm',
      });
      const devToken = createTestToken(dev);

      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Permission World',
          description: 'Permission test',
        });

      const worldId = worldRes.body.id;

      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'Permission Test Event',
          description: 'Test',
          event_type: 'small',
        });

      const eventId = eventRes.body.id;

      // Create another player (not a dev of this world)
      const otherPlayer = createTestUser({
        db,
        username: 'e21_other_player',
        email: 'e21_other_player@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Other Player',
      });
      const otherPlayerToken = createTestToken(otherPlayer);

      // Other player tries to transition event status
      const updateRes = await request(app)
        .patch(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${otherPlayerToken}`)
        .send({ status: 'approved' });

      expect(updateRes.status).toBe(403);
      expect(updateRes.body.error).toContain('Dev only');
    });

    test('event with posts count should be included in event list', async () => {
      const dev = createTestUser({
        db,
        username: 'e21_dev_posts',
        email: 'e21_dev_posts@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Posts',
      });
      const devToken = createTestToken(dev);

      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Posts World',
          description: 'World for posts count test',
        });

      const worldId = worldRes.body.id;

      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'Event with Posts',
          description: 'Test',
          event_type: 'small',
        });

      const eventId = eventRes.body.id;

      // Get events for world (should include post_count)
      const listRes = await request(app)
        .get(`/api/events/world/${worldId}`)
        .send({});

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);

      const event = listRes.body.find((e) => e.id === eventId);
      expect(event).toBeDefined();
      expect(event.post_count).toBeDefined();
      expect(event.post_count).toBe(0);
    });
  });

  describe('Proposed Events Access Control', () => {
    test('proposed events visible only to dev of the world', async () => {
      const dev = createTestUser({
        db,
        username: 'e21_dev_access',
        email: 'e21_dev_access@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Access',
      });
      const devToken = createTestToken(dev);

      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Access World',
          description: 'World for access control test',
        });

      const worldId = worldRes.body.id;

      // Create player and add to world
      const player = createTestUser({
        db,
        username: 'e21_player_access',
        email: 'e21_player_access@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Player Access',
      });
      const playerToken = createTestToken(player);

      await request(app)
        .post(`/api/worlds/${worldId}/join`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({});

      const membersRes = await request(app)
        .get(`/api/worlds/${worldId}/members/pending`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({});

      const playerId = membersRes.body[0].id;
      await request(app)
        .patch(`/api/worlds/${worldId}/members/${playerId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({ status: 'approved' });

      // Player creates proposed event
      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({
          title: 'Player Proposed Event',
          description: 'Test',
          event_type: 'small',
        });

      const eventId = eventRes.body.id;

      // Dev can see proposed events
      const devProposedRes = await request(app)
        .get(`/api/events/world/${worldId}/proposed`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({});

      expect(devProposedRes.status).toBe(200);
      const proposedEvent = devProposedRes.body.find((e) => e.id === eventId);
      expect(proposedEvent).toBeDefined();

      // Player (non-dev) cannot see proposed events
      const playerProposedRes = await request(app)
        .get(`/api/events/world/${worldId}/proposed`)
        .set('Authorization', `Bearer ${playerToken}`)
        .send({});

      expect(playerProposedRes.status).toBe(403);
      expect(playerProposedRes.body.error).toContain('Dev only');
    });
  });

  describe('Event Validation', () => {
    test('creating event without title returns 400', async () => {
      const dev = createTestUser({
        db,
        username: 'e21_dev_validation',
        email: 'e21_dev_validation@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Validation',
      });
      const devToken = createTestToken(dev);

      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Validation World',
          description: 'Validation test',
        });

      const worldId = worldRes.body.id;

      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          description: 'Event without title',
          event_type: 'small',
        });

      expect(eventRes.status).toBe(400);
      expect(eventRes.body.error).toContain('Title required');
    });

    test('creating event as non-member returns 403', async () => {
      const dev = createTestUser({
        db,
        username: 'e21_dev_nonmember',
        email: 'e21_dev_nonmember@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Dev Nonmember',
      });
      const devToken = createTestToken(dev);

      const worldRes = await request(app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          title: 'E2.1 Nonmember World',
          description: 'Nonmember test',
        });

      const worldId = worldRes.body.id;

      // Create user not in world
      const outsider = createTestUser({
        db,
        username: 'e21_outsider',
        email: 'e21_outsider@example.com',
        password: 'Password123!',
        displayName: 'E2.1 Outsider',
      });
      const outsiderToken = createTestToken(outsider);

      const eventRes = await request(app)
        .post(`/api/events/world/${worldId}`)
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({
          title: 'Outsider Event',
          event_type: 'small',
        });

      expect(eventRes.status).toBe(403);
      expect(eventRes.body.error).toContain('Not a member');
    });
  });
});
