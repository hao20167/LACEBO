import jwt from 'jsonwebtoken';
import config from '../config/index.js';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), config.jwtSecret);
    } catch { /* ignore */ }
  }
  next();
}
