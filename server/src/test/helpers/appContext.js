import { setupTestDb, cleanupTestDb, resetDatabase } from './testDb.js';

export function createAppContext() {
  const ctx = { app: null, db: null, testDbPath: null };

  beforeAll(async () => {
    ctx.testDbPath = setupTestDb();
    const dbModule = await import('../../database/connection.js');
    ctx.db = dbModule.default;
    const schemaModule = await import('../../database/schema.js');
    schemaModule.initDatabase();
    const appModule = await import('../../index.js');
    ctx.app = appModule.default;
  });

  beforeEach(() => {
    resetDatabase(ctx.db);
  });

  afterAll(() => {
    if (ctx.db) ctx.db.close();
    cleanupTestDb(ctx.testDbPath);
  });

  return ctx;
}
