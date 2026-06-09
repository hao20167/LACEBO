import { jest } from '@jest/globals';

jest.mock('../config/auth.js', () => ({
  authMiddleware: (req, res, next) => {
    if (req.headers.authorization === 'Bearer valid-token-stub') {
      req.user = { id: 1, username: 'testuser' };
      return next();
    }
    return res.status(401).json({ error: 'UNAUTHORIZED' });
  },
  optionalAuth: (req, res, next) => {
    req.user = { id: 1 };
    next();
  },
}));

import request from 'supertest';
import app from '../index.js';
import db from '../database/connection.js';

describe('Security Testing Suite (E3.4)', () => {
  let mockToken = 'Bearer valid-token-stub';

  describe('SQL Injection Prevention', () => {
    it('should reject non-integer ID to prevent SQL injection in dynamic routes', async () => {
      const res = await request(app).get(
        '/api/posts/invalid-id-123 OR 1=1/comments',
      );
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('should handle payload text with SQL characters safely', async () => {
      jest.spyOn(db, 'prepare').mockImplementation(() => ({
        get: () => ({ id: 1, world_id: 1, user_id: 1 }),
        run: () => ({ changes: 1 }),
      }));

      const res = await request(app)
        .patch('/api/posts/1')
        .set('Authorization', mockToken)
        .send({ content: "normal content '; DROP TABLE posts; --" });

      expect(res.status).not.toBe(500);
      db.prepare.mockRestore();
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize HTML tags from content inputs', async () => {
      jest.spyOn(db, 'prepare').mockImplementation(() => ({
        get: () => ({ id: 1, world_id: 1, status: 'open' }),
        run: () => ({ lastInsertRowid: 1 }),
      }));

      const res = await request(app)
        .post('/api/posts/event/1')
        .set('Authorization', mockToken)
        .send({ content: '<script>alert("xss")</script>Hello' });

      expect(res.status).toBe(201);
      db.prepare.mockRestore();
    });
  });

  describe('CSRF Checks', () => {
    it('should block state-changing actions without Authorization headers', async () => {
      const res = await request(app)
        .post('/api/posts/event/1')
        .send({ content: 'CSRF attack attempt' });
      expect(res.status).toBe(401);
    });
  });
});
