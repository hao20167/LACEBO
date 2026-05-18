import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const cwd = process.cwd();
const defaultDbPath = cwd.endsWith(`${path.sep}server`)
  ? path.join(cwd, 'data', 'lacebo.db')
  : path.join(cwd, 'server', 'data', 'lacebo.db');

// Keep a map of DB instances keyed by absolute path to allow multiple test DBs
const dbInstances = new Map();

function getDbPath() {
  return process.env.DB_PATH || defaultDbPath;
}

function ensureDataDir(dbPath) {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function createDb(dbPath) {
  ensureDataDir(dbPath);
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function getOrCreateDb() {
  const dbPath = getDbPath();
  if (!dbInstances.has(dbPath)) {
    const db = createDb(dbPath);
    dbInstances.set(dbPath, db);
  }
  return dbInstances.get(dbPath);
}

// Export a proxy that lazily forwards property access to the current DB instance.
const proxy = new Proxy({}, {
  get(_target, prop) {
    const db = getOrCreateDb();
    if (prop === 'close') {
      return (...args) => {
        const dbPath = getDbPath();
        try {
          return db.close(...args);
        } finally {
          dbInstances.delete(dbPath);
        }
      };
    }
    const value = db[prop];
    // If the property is a function, bind it to the db instance
    if (typeof value === 'function') return value.bind(db);
    return value;
  },
});

// Also expose a utility to close and clear DB instances (useful in tests)
proxy._closeAll = function closeAll() {
  for (const [p, instance] of dbInstances.entries()) {
    try {
      instance.close();
    } catch (_) {
      // Ignore close errors during cleanup so all cached instances are cleared.
    }
    dbInstances.delete(p);
  }
};

export default proxy;
