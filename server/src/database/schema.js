import db from './connection.js';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      display_name TEXT NOT NULL,
      avatar_url TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS worlds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover_image TEXT DEFAULT NULL,
      owner_id INTEGER DEFAULT NULL,
      is_public INTEGER DEFAULT 1,
      deletion_scheduled_at DATETIME DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS world_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      world_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('dev', 'player')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      credits INTEGER DEFAULT 0,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(world_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      world_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      event_type TEXT NOT NULL CHECK(event_type IN ('big', 'small')),
      status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed', 'approved', 'open', 'closed', 'rejected')),
      start_date DATETIME,
      end_date DATETIME,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY(created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      world_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT DEFAULT NULL,
      post_type TEXT NOT NULL DEFAULT 'normal' CHECK(post_type IN ('normal', 'announcement', 'event_description')),
      status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY(world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT DEFAULT NULL,
      parent_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      comment_id INTEGER,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id),
      UNIQUE(post_id, user_id),
      UNIQUE(comment_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      world_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(world_id) REFERENCES worlds(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    -- Indexes for frequently queried columns
    CREATE INDEX IF NOT EXISTS idx_world_members_world_id ON world_members(world_id);
    CREATE INDEX IF NOT EXISTS idx_world_members_user_id ON world_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_world_members_world_user ON world_members(world_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_world_members_status ON world_members(world_id, status);
    CREATE INDEX IF NOT EXISTS idx_events_world_id ON events(world_id);
    CREATE INDEX IF NOT EXISTS idx_events_status ON events(world_id, status);
    CREATE INDEX IF NOT EXISTS idx_posts_event_id ON posts(event_id);
    CREATE INDEX IF NOT EXISTS idx_posts_world_id ON posts(world_id);
    CREATE INDEX IF NOT EXISTS idx_posts_world_status ON posts(world_id, status);
    CREATE INDEX IF NOT EXISTS idx_posts_event_status ON posts(event_id, status);
    CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
    CREATE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_comment_user ON likes(comment_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_announcements_world_id ON announcements(world_id);
    CREATE INDEX IF NOT EXISTS idx_worlds_public_created ON worlds(is_public, created_at);
  `);

  const worldColumns = db.prepare("PRAGMA table_info(worlds)").all();

  const hasDeletionColumn = worldColumns.some((column) => column.name === 'deletion_scheduled_at');
  if (!hasDeletionColumn) {
    db.exec('ALTER TABLE worlds ADD COLUMN deletion_scheduled_at DATETIME DEFAULT NULL');
  }

  const hasWorldBackground = worldColumns.some((column) => column.name === 'background_image_url');
  if (!hasWorldBackground) {
    db.exec('ALTER TABLE worlds ADD COLUMN background_image_url TEXT DEFAULT NULL');
  }

  const commentColumns = db.prepare("PRAGMA table_info(comments)").all();
  const hasCommentImageUrl = commentColumns.some((column) => column.name === 'image_url');
  if (!hasCommentImageUrl) {
    db.exec('ALTER TABLE comments ADD COLUMN image_url TEXT DEFAULT NULL');
  }

  const hasParentId = commentColumns.some((column) => column.name === 'parent_id');
  if (!hasParentId) {
    db.exec('ALTER TABLE comments ADD COLUMN parent_id INTEGER DEFAULT NULL');
  }
}
