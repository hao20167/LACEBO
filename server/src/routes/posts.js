import { Router } from 'express';
import db from '../database/connection.js';
import { authMiddleware, optionalAuth } from '../config/auth.js';
import { isDev, addCredits } from '../helpers/world.js';

const router = Router();

// Get announcements for a world
router.get('/world/:worldId/announcements', optionalAuth, (req, res) => {
  const announcements = db
    .prepare(
      `
    SELECT a.*, u.username, u.display_name, u.avatar_url
    FROM announcements a JOIN users u ON u.id = a.user_id
    WHERE a.world_id = ?
    ORDER BY a.created_at DESC
  `,
    )
    .all(req.params.worldId);
  res.json(announcements);
});

// Create an announcement (dev only)
router.post('/world/:worldId/announcements', authMiddleware, (req, res) => {
  const { worldId } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content required' });
  }

  if (!isDev(worldId, req.user.id)) {
    return res.status(403).json({ error: 'Dev only' });
  }

  const result = db
    .prepare(
      'INSERT INTO announcements (world_id, user_id, title, content) VALUES (?, ?, ?, ?)',
    )
    .run(worldId, req.user.id, title, content);

  const announcement = db
    .prepare(
      `
    SELECT a.*, u.username, u.display_name, u.avatar_url
    FROM announcements a JOIN users u ON u.id = a.user_id
    WHERE a.id = ?
  `,
    )
    .get(result.lastInsertRowid);

  res.status(201).json(announcement);
});

// Get posts for an event
router.get('/event/:eventId', optionalAuth, (req, res) => {
  const posts = db
    .prepare(
      `
    SELECT p.*, u.username, u.display_name, u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as like_count,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
    FROM posts p JOIN users u ON u.id = p.user_id
    WHERE p.event_id = ? AND p.status = 'approved'
    ORDER BY p.created_at DESC
  `,
    )
    .all(req.params.eventId);

  if (req.user && posts.length > 0) {
    const postIds = posts.map((post) => post.id);
    const placeholders = postIds.map(() => '?').join(', ');
    const likedRows = db
      .prepare(
        `SELECT post_id FROM likes WHERE user_id = ? AND post_id IN (${placeholders})`,
      )
      .all(req.user.id, ...postIds);
    const likedPostIds = new Set(likedRows.map((row) => row.post_id));

    for (const post of posts) {
      post.liked = likedPostIds.has(post.id);
    }
  } else if (req.user) {
    for (const post of posts) {
      post.liked = false;
    }
  }
  res.json(posts);
});

// Create post in event
router.post('/event/:eventId', authMiddleware, (req, res) => {
  const event = db
    .prepare('SELECT * FROM events WHERE id = ?')
    .get(req.params.eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.status !== 'open')
    return res.status(400).json({ error: 'Event is not open' });

  const member = db
    .prepare(
      "SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND status = 'approved'",
    )
    .get(event.world_id, req.user.id);
  if (!member)
    return res.status(403).json({ error: 'Not a member of this world' });

  const { content, image_url } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  const status = member.role === 'dev' ? 'approved' : 'pending';
  const result = db
    .prepare(
      'INSERT INTO posts (event_id, world_id, user_id, content, image_url, status) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(
      event.id,
      event.world_id,
      req.user.id,
      content,
      image_url || null,
      status,
    );

  if (status === 'approved') {
    addCredits(event.world_id, req.user.id, 10);
  }

  const post = db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(post);
});

// Approve post (dev only)
router.patch('/:postId/approve', authMiddleware, (req, res) => {
  const post = db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!isDev(post.world_id, req.user.id))
    return res.status(403).json({ error: 'Dev only' });

  const result = db
    .prepare(
      "UPDATE posts SET status = 'approved' WHERE id = ? AND status = 'pending'",
    )
    .run(post.id);
  if (result.changes === 0) {
    return res.status(400).json({ error: 'Post is not pending' });
  }

  addCredits(post.world_id, post.user_id, 10);
  res.json({ success: true });
});

// Reject post (dev only)
router.patch('/:postId/reject', authMiddleware, (req, res) => {
  const post = db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (!isDev(post.world_id, req.user.id))
    return res.status(403).json({ error: 'Dev only' });

  const result = db
    .prepare(
      "UPDATE posts SET status = 'rejected' WHERE id = ? AND status = 'pending'",
    )
    .run(post.id);
  if (result.changes === 0) {
    return res.status(400).json({ error: 'Post is not pending' });
  }

  res.json({ success: true });
});

// Get pending posts (dev only)
router.get('/world/:worldId/pending', authMiddleware, (req, res) => {
  if (!isDev(req.params.worldId, req.user.id))
    return res.status(403).json({ error: 'Dev only' });
  const posts = db
    .prepare(
      `
    SELECT p.*, u.username, u.display_name
    FROM posts p JOIN users u ON u.id = p.user_id
    WHERE p.world_id = ? AND p.status = 'pending'
    ORDER BY p.created_at DESC
  `,
    )
    .all(req.params.worldId);
  res.json(posts);
});

// Like/unlike a post
router.post('/:postId/like', authMiddleware, (req, res) => {
  const postId = req.params.postId;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const existing = db
    .prepare('SELECT id FROM likes WHERE post_id = ? AND user_id = ?')
    .get(postId, req.user.id);
  if (existing) {
    db.prepare('DELETE FROM likes WHERE id = ?').run(existing.id);
    addCredits(post.world_id, post.user_id, -1);
    res.json({ liked: false });
  } else {
    db.prepare('INSERT INTO likes (post_id, user_id) VALUES (?, ?)').run(
      postId,
      req.user.id,
    );
    addCredits(post.world_id, post.user_id, 1);
    res.json({ liked: true });
  }
});

// Get comments for a post
router.get('/:postId/comments', optionalAuth, (req, res) => {
  const comments = db
    .prepare(
      `
    SELECT c.*, u.username, u.display_name, u.avatar_url,
      (SELECT COUNT(*) FROM likes WHERE comment_id = c.id) as like_count
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `,
    )
    .all(req.params.postId);
  res.json(comments);
});

// Add comment
router.post('/:postId/comments', authMiddleware, (req, res) => {
  const post = db
    .prepare('SELECT * FROM posts WHERE id = ?')
    .get(req.params.postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const member = db
    .prepare(
      "SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND status = 'approved'",
    )
    .get(post.world_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Not a member' });

  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  const result = db
    .prepare(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
    )
    .run(post.id, req.user.id, content);
  addCredits(post.world_id, req.user.id, 2);

  const comment = db
    .prepare(
      `
    SELECT c.*, u.username, u.display_name, u.avatar_url
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.id = ?
  `,
    )
    .get(result.lastInsertRowid);
  res.status(201).json(comment);
});

export default router;
