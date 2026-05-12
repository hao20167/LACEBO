import { setupTestDb, cleanupTestDb, resetDatabase } from './helpers/testDb.js';
import { createTestUser } from './helpers/auth.js';

describe('World Helper Unit Tests', () => {
  let db;
  let testDbPath;
  let isMember, isDev;

  beforeAll(async () => {
    testDbPath = setupTestDb();
    const dbModule = await import('../database/connection.js');
    db = dbModule.default;
    const schemaModule = await import('../database/schema.js');
    schemaModule.initDatabase();

    const helperModule = await import('../helpers/world.js');
    isMember = helperModule.isMember;
    isDev = helperModule.isDev;
  });

  beforeEach(() => {
    resetDatabase(db);
  });

  afterAll(() => {
    if (db) db.close();
    cleanupTestDb(testDbPath);
  });

  test('isMember should return member if approved', () => {
    const user = createTestUser({ db, username: 'member' });
    db.prepare("INSERT INTO worlds (title) VALUES ('Test World')").run();
    const worldId = 1;
    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'player', 'approved')",
    ).run(worldId, user.id);

    const result = isMember(worldId, user.id);
    expect(result).toBeDefined();
    expect(result.user_id).toBe(user.id);
  });

  test('isMember should return undefined if pending', () => {
    const user = createTestUser({ db, username: 'pending' });
    db.prepare("INSERT INTO worlds (title) VALUES ('Test World')").run();
    const worldId = 1;
    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'player', 'pending')",
    ).run(worldId, user.id);

    const result = isMember(worldId, user.id);
    expect(result).toBeUndefined();
  });

  test('isDev should return member if dev and approved', () => {
    const user = createTestUser({ db, username: 'dev' });
    db.prepare("INSERT INTO worlds (title) VALUES ('Test World')").run();
    const worldId = 1;
    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'dev', 'approved')",
    ).run(worldId, user.id);

    const result = isDev(worldId, user.id);
    expect(result).toBeDefined();
    expect(result.role).toBe('dev');
  });
});
