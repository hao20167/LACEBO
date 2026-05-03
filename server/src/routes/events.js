import { Router } from 'express';
import db from '../database/connection.js';
import { authMiddleware } from '../middlewares/auth.js';
import { isDev, isMember } from '../helpers/world.js';

const router = Router();

// Get events for a world (lore/timeline)
router.get('/world/:worldId', (req, res) => {
  const events = db.prepare(`
    SELECT e.*, u.username as creator_name, u.display_name as creator_display_name,
      (SELECT COUNT(*) FROM posts WHERE event_id = e.id AND status = 'approved') as post_count
    FROM events e 
    JOIN users u ON u.id = e.created_by
    WHERE e.world_id = ? AND e.status != 'proposed'
    ORDER BY e.start_date ASC
  `).all(req.params.worldId);
  res.json(events);
});

// Get proposed events (dev only)
router.get('/world/:worldId/proposed', authMiddleware, (req, res) => {
  if (!isDev(req.params.worldId, req.user.id)) {
    return res.status(403).json({ error: 'Dev only' });
  }
  const events = db.prepare(`
    SELECT e.*, u.username as creator_name, u.display_name as creator_display_name
    FROM events e JOIN users u ON u.id = e.created_by
    WHERE e.world_id = ? AND e.status = 'proposed'
    ORDER BY e.created_at DESC
  `).all(req.params.worldId);
  res.json(events);
});

// Create event
router.post('/world/:worldId', authMiddleware, (req, res) => {
  const { title, description, event_type, start_date, end_date } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const worldId = req.params.worldId;
  const member = isMember(worldId, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  let status;
  if (member.role === 'dev') {
    status = event_type === 'big' ? 'open' : 'approved';
  } else {
    if (event_type === 'big') return res.status(403).json({ error: 'Only devs can create big events' });
    status = 'proposed';
  }

  const result = db.prepare(
    'INSERT INTO events (world_id, title, description, event_type, status, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(worldId, title, description || '', event_type || 'small', status, start_date || null, end_date || null, req.user.id);
  
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(event);
});

// Approve/open/close event (dev only)
router.patch('/:eventId', authMiddleware, (req, res) => {
  const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (!isDev(event.world_id, req.user.id)) return res.status(403).json({ error: 'Dev only' });

  const { status, title, description, start_date, end_date } = req.body;
  
  if (status) {
    db.prepare('UPDATE events SET status = ? WHERE id = ?').run(status, event.id);
  }
  if (title) db.prepare('UPDATE events SET title = ? WHERE id = ?').run(title, event.id);
  if (description !== undefined) db.prepare('UPDATE events SET description = ? WHERE id = ?').run(description, event.id);
  if (start_date) db.prepare('UPDATE events SET start_date = ? WHERE id = ?').run(start_date, event.id);
  if (end_date) db.prepare('UPDATE events SET end_date = ? WHERE id = ?').run(end_date, event.id);

  const updated = db.prepare('SELECT * FROM events WHERE id = ?').get(event.id);
  res.json(updated);
});

// Get single event
router.get('/:eventId', (req, res) => {
  const event = db.prepare(`
    SELECT e.*, u.username as creator_name, u.display_name as creator_display_name
    FROM events e JOIN users u ON u.id = e.created_by
    WHERE e.id = ?
  `).get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json(event);
});

export default router;
