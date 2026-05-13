import fs from 'fs';
import path from 'path';
const dataDir = path.join(process.cwd(), 'data');
let testDbSequence = 0;

function createTestDbFilename() {
  testDbSequence += 1;
  return `test-e15-worlds-${process.pid}-${Date.now()}-${testDbSequence}.db`;
}

export function setupTestDb(filename = createTestDbFilename()) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, filename);
  cleanupTestDb(dbPath);
  process.env.DB_PATH = dbPath;
  process.env.NODE_ENV = 'test';
  return dbPath;
}

export function resetDatabase(db) {
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
}

export function cleanupTestDb(dbPath) {
  if (!dbPath) return;

  const sidecars = [`${dbPath}-wal`, `${dbPath}-shm`];
  for (const filePath of [dbPath, ...sidecars]) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
