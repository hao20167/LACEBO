import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/connection.js';
import { generateToken, authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { username, email, password, display_name } = req.body;
  if (!username || !email || !password || !display_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ error: 'Username or email already exists' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)').run(username, email, hash, display_name);
  const user = { id: result.lastInsertRowid, username, display_name };
  res.status(201).json({ user, token: generateToken(user) });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser, token: generateToken(user) });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

export default router;
