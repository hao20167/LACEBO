import Database from 'better-sqlite3';
import path from 'path';
import config from '../config/index.js';

const cwd = process.cwd();
const defaultDbPath = cwd.endsWith(`${path.sep}server`)
  ? path.join(cwd, 'data', 'lacebo.db')
  : path.join(cwd, 'server', 'data', 'lacebo.db');
const dbPath = config.dbPath || defaultDbPath;

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export default db;
