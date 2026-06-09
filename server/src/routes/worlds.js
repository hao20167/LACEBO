import { Router } from 'express';
import db from '../database/connection.js';
import { authMiddleware, optionalAuth } from '../config/auth.js';

const router = Router();
// Change this value to adjust when a scheduled delete happens.
// Valid SQLite datetime modifiers include '3 minutes', '10 days', '1 hour', etc.
const SCHEDULED_DELETE_DELAY = '3 minutes';

const cleanupExpiredWorld = (worldId) => {
  const expiredWorld = db
    .prepare(
      `SELECT id FROM worlds WHERE id = ? AND deletion_scheduled_at IS NOT NULL AND datetime(deletion_scheduled_at) <= CURRENT_TIMESTAMP`,
    )
    .get(worldId);
  if (expiredWorld) {
    db.prepare('DELETE FROM worlds WHERE id = ?').run(worldId);
    return true;
  }
  return false;
};

const cleanupExpiredWorlds = () => {
  db.prepare(
    `DELETE FROM worlds WHERE deletion_scheduled_at IS NOT NULL AND datetime(deletion_scheduled_at) <= CURRENT_TIMESTAMP`,
  ).run();
};

const requireDev = (worldId, userId) => {
  return db
    .prepare(
      "SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND role = 'dev' AND status = 'approved'",
    )
    .get(worldId, userId);
};

// List all worlds (with search)
router.get('/', optionalAuth, (req, res) => {
  cleanupExpiredWorlds();
  const { search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let worlds;
  if (search) {
    worlds = db
      .prepare(
        `
      SELECT w.*, 
        (SELECT COUNT(*) FROM world_members WHERE world_id = w.id AND status = 'approved') as member_count
      FROM worlds w 
      WHERE w.title LIKE ? AND w.is_public = 1 AND w.deletion_scheduled_at IS NULL
      ORDER BY w.created_at DESC LIMIT ? OFFSET ?
    `,
      )
      .all(`%${search}%`, Number(limit), Number(offset));
  } else {
    worlds = db
      .prepare(
        `
      SELECT w.*,
        (SELECT COUNT(*) FROM world_members WHERE world_id = w.id AND status = 'approved') as member_count
      FROM worlds w 
      WHERE w.is_public = 1 AND w.deletion_scheduled_at IS NULL
      ORDER BY w.created_at DESC LIMIT ? OFFSET ?
    `,
      )
      .all(Number(limit), Number(offset));
  }
  res.json(worlds);
});

// Get my worlds
router.get('/mine', authMiddleware, (req, res) => {
  cleanupExpiredWorlds();
  const worlds = db
    .prepare(
      `
    SELECT w.*, wm.role, wm.credits,
      (SELECT COUNT(*) FROM world_members WHERE world_id = w.id AND status = 'approved') as member_count
    FROM worlds w
    JOIN world_members wm ON wm.world_id = w.id AND wm.user_id = ?
    WHERE wm.status = 'approved' AND w.deletion_scheduled_at IS NULL
    ORDER BY w.created_at DESC
  `,
    )
    .all(req.user.id);
  res.json(worlds);
});

// Create world
router.post('/', authMiddleware, (req, res) => {
  const { title, description, is_public = 1 } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const result = db
    .prepare(
      'INSERT INTO worlds (title, description, is_public) VALUES (?, ?, ?)',
    )
    .run(title, description || '', is_public ? 1 : 0);
  const worldId = result.lastInsertRowid;
  // Creator becomes dev
  db.prepare(
    "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'dev', 'approved')",
  ).run(worldId, req.user.id);
  const world = db.prepare('SELECT * FROM worlds WHERE id = ?').get(worldId);
  res.status(201).json(world);
});

// Get single world
router.get('/:id', optionalAuth, (req, res) => {
  const worldId = req.params.id;
  if (cleanupExpiredWorld(worldId)) {
    return res.status(404).json({ error: 'World not found' });
  }

  const world = db
    .prepare(
      `
    SELECT w.*,
      (SELECT COUNT(*) FROM world_members WHERE world_id = w.id AND status = 'approved') as member_count
    FROM worlds w WHERE w.id = ?
  `,
    )
    .get(worldId);
  if (!world) return res.status(404).json({ error: 'World not found' });

  let membership = null;
  if (req.user) {
    membership = db
      .prepare('SELECT * FROM world_members WHERE world_id = ? AND user_id = ?')
      .get(world.id, req.user.id);
  }
  world.membership = membership;
  res.json(world);
});

// Join world
router.post('/:id/join', authMiddleware, (req, res) => {
  const worldId = req.params.id;
  const world = db.prepare('SELECT * FROM worlds WHERE id = ?').get(worldId);
  if (!world) return res.status(404).json({ error: 'World not found' });

  const existing = db
    .prepare('SELECT * FROM world_members WHERE world_id = ? AND user_id = ?')
    .get(worldId, req.user.id);
  if (existing) {
    if (existing.status === 'rejected') {
      db.prepare(
        "UPDATE world_members SET status = 'pending', role = 'player' WHERE id = ?",
      ).run(existing.id);
      const membership = db
        .prepare('SELECT * FROM world_members WHERE id = ?')
        .get(existing.id);
      return res.status(201).json(membership);
    }

    return res
      .status(409)
      .json({ error: 'Already a member or pending', membership: existing });
  }

  db.prepare(
    "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, 'player', 'pending')",
  ).run(worldId, req.user.id);
  const membership = db
    .prepare('SELECT * FROM world_members WHERE world_id = ? AND user_id = ?')
    .get(worldId, req.user.id);
  res.status(201).json(membership);
});

// Approve/reject player (dev only)
router.patch('/:id/members/:memberId', authMiddleware, (req, res) => {
  const { status } = req.body; // 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res
      .status(400)
      .json({ error: 'Status must be approved or rejected' });
  }
  // Check requester is dev
  const devCheck = db
    .prepare(
      "SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND role = 'dev' AND status = 'approved'",
    )
    .get(req.params.id, req.user.id);
  if (!devCheck)
    return res.status(403).json({ error: 'Only devs can manage members' });

  db.prepare(
    'UPDATE world_members SET status = ? WHERE id = ? AND world_id = ?',
  ).run(status, req.params.memberId, req.params.id);
  res.json({ success: true });
});

// Get pending members (dev only)
router.get('/:id/members/pending', authMiddleware, (req, res) => {
  const devCheck = db
    .prepare(
      "SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND role = 'dev' AND status = 'approved'",
    )
    .get(req.params.id, req.user.id);
  if (!devCheck)
    return res
      .status(403)
      .json({ error: 'Only devs can view pending members' });

  const members = db
    .prepare(
      `
    SELECT wm.*, u.username, u.display_name, u.avatar_url
    FROM world_members wm JOIN users u ON u.id = wm.user_id
    WHERE wm.world_id = ? AND wm.status = 'pending'
  `,
    )
    .all(req.params.id);
  res.json(members);
});

// Schedule world deletion (dev only)
router.post('/:id/schedule-delete', authMiddleware, (req, res) => {
  const worldId = req.params.id;
  if (cleanupExpiredWorld(worldId)) {
    return res.status(404).json({ error: 'World not found' });
  }

  if (!requireDev(worldId, req.user.id)) {
    return res.status(403).json({ error: 'Only devs can delete worlds' });
  }

  const world = db.prepare('SELECT * FROM worlds WHERE id = ?').get(worldId);
  if (!world) return res.status(404).json({ error: 'World not found' });

  const result = db
    .prepare(
      `UPDATE worlds SET deletion_scheduled_at = datetime('now', '+${SCHEDULED_DELETE_DELAY}') WHERE id = ?`,
    )
    .run(worldId);

  const updatedWorld = db.prepare('SELECT * FROM worlds WHERE id = ?').get(worldId);
  res.json({ ...updatedWorld });
});

router.post('/:id/undo-delete', authMiddleware, (req, res) => {
  const worldId = req.params.id;
  if (cleanupExpiredWorld(worldId)) {
    return res.status(404).json({ error: 'World not found' });
  }

  if (!requireDev(worldId, req.user.id)) {
    return res.status(403).json({ error: 'Only devs can undo world deletion' });
  }

  db.prepare('UPDATE worlds SET deletion_scheduled_at = NULL WHERE id = ?').run(worldId);
  const updatedWorld = db.prepare('SELECT * FROM worlds WHERE id = ?').get(worldId);
  res.json({ ...updatedWorld });
});

// Get leaderboard
router.get('/:id/leaderboard', (req, res) => {
  const members = db
    .prepare(
      `
    SELECT wm.credits, wm.role, u.id, u.username, u.display_name, u.avatar_url
    FROM world_members wm JOIN users u ON u.id = wm.user_id
    WHERE wm.world_id = ? AND wm.status = 'approved'
    ORDER BY wm.credits DESC LIMIT 50
  `,
    )
    .all(req.params.id);
  res.json(members);
});

// Get all members
router.get('/:id/members', (req, res) => {
  const members = db
    .prepare(
      `
    SELECT wm.*, u.username, u.display_name, u.avatar_url
    FROM world_members wm JOIN users u ON u.id = wm.user_id
    WHERE wm.world_id = ? AND wm.status = 'approved'
    ORDER BY wm.role ASC, wm.credits DESC
  `,
    )
    .all(req.params.id);
  res.json(members);
});

export default router;
