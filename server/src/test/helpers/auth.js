import bcrypt from 'bcryptjs';
import { generateToken } from '../../config/auth.js';

export function createTestUser({
  db,
  username,
  email = `${username}@example.com`,
  password = 'password123',
  displayName = username,
}) {
  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)',
    )
    .run(username, email, hash, displayName);

  return {
    id: Number(result.lastInsertRowid),
    username,
    email,
    display_name: displayName,
  };
}

export function createTestToken(user) {
  return generateToken(user);
}
