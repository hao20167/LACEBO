import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/connection.js';
import { generateToken, authMiddleware } from '../config/auth.js';
import { authRateLimiter, registerRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidators,
  loginValidators,
  updateProfileValidators,
  userIdParamValidators,
} from '../middleware/validators/users.js';

const router = Router();

router.post('/register', registerRateLimiter, validate(registerValidators), (req, res) => {
  const { username, email, password, display_name } = req.body;
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'Username or email already exists' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare(
      'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)',
    )
    .run(username, email, hash, display_name);
  const user = { id: result.lastInsertRowid, username, display_name };
  res.status(201).json({ user, token: generateToken(user) });
});

router.post('/login', authRateLimiter, validate(loginValidators), (req, res) => {
  const { username, password } = req.body;
  const user = db
    .prepare('SELECT * FROM users WHERE username = ?')
    .get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const safeUser = { ...user };
  delete safeUser.password;
  res.json({ user: safeUser, token: generateToken(user) });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db
    .prepare(
      'SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = ?',
    )
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.patch('/me', authMiddleware, validate(updateProfileValidators), (req, res) => {
  const { display_name, avatar } = req.body;
  const updates = [];
  const values = [];

  if (display_name !== undefined) {
    updates.push('display_name = ?');
    values.push(display_name.trim());
  }

  if (avatar !== undefined) {
    updates.push('avatar_url = ?');
    values.push(avatar.trim());
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No profile fields provided' });
  }

  db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(
    ...values,
    req.user.id,
  );

  const user = db
    .prepare(
      'SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = ?',
    )
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.get('/:id', validate(userIdParamValidators), (req, res) => {
  const user = db
    .prepare(
      'SELECT id, username, display_name, avatar_url, created_at FROM users WHERE id = ?',
    )
    .get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
