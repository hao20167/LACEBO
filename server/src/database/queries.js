import db from './connection.js';

// Reusable prepared statements — prepared once, executed many times.
// better-sqlite3 caches prepared statements per connection, but explicit
// module-level constants make the hot paths obvious and avoid re-preparing
// on every request in hot loops.

export const stmts = {
  // users
  getUserById: db.prepare(
    'SELECT id, username, email, display_name, avatar_url, created_at FROM users WHERE id = ?',
  ),
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
  getUserByUsernameOrEmail: db.prepare(
    'SELECT id FROM users WHERE username = ? OR email = ?',
  ),
  insertUser: db.prepare(
    'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)',
  ),

  // worlds
  getWorldById: db.prepare(
    `SELECT w.*, (SELECT COUNT(*) FROM world_members WHERE world_id = w.id AND status = 'approved') as member_count FROM worlds w WHERE w.id = ?`,
  ),
  insertWorld: db.prepare(
    'INSERT INTO worlds (title, description, is_public) VALUES (?, ?, ?)',
  ),

  // world_members
  getMembership: db.prepare(
    'SELECT * FROM world_members WHERE world_id = ? AND user_id = ?',
  ),
  getDevMembership: db.prepare(
    "SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND role = 'dev' AND status = 'approved'",
  ),
  getApprovedMembership: db.prepare(
    "SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND status = 'approved'",
  ),
  insertMember: db.prepare(
    "INSERT INTO world_members (world_id, user_id, role, status) VALUES (?, ?, ?, ?)",
  ),
  updateMemberStatus: db.prepare(
    'UPDATE world_members SET status = ? WHERE id = ? AND world_id = ?',
  ),
  updateMemberCredits: db.prepare(
    'UPDATE world_members SET credits = credits + ? WHERE world_id = ? AND user_id = ?',
  ),

  // posts
  getPostById: db.prepare('SELECT * FROM posts WHERE id = ?'),
  insertPost: db.prepare(
    'INSERT INTO posts (event_id, world_id, user_id, content, image_url, status) VALUES (?, ?, ?, ?, ?, ?)',
  ),
  updatePostStatus: db.prepare(
    "UPDATE posts SET status = ? WHERE id = ? AND status = 'pending'",
  ),
  updatePostContent: db.prepare('UPDATE posts SET content = ? WHERE id = ?'),
  deletePost: db.prepare('DELETE FROM posts WHERE id = ?'),

  // comments
  insertComment: db.prepare(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
  ),

  // likes
  getLike: db.prepare(
    'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
  ),
  insertLike: db.prepare(
    'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
  ),
  deleteLike: db.prepare('DELETE FROM likes WHERE id = ?'),

  // events
  getEventById: db.prepare('SELECT * FROM events WHERE id = ?'),
};
