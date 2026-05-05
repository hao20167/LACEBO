import db from '../database/connection.js';

export function isMember(worldId, userId) {
  return db
    .prepare(
      'SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND status = ?'
    )
    .get(worldId, userId, 'approved');
}

export function isDev(worldId, userId) {
  return db
    .prepare(
      'SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND role = ? AND status = ?'
    )
    .get(worldId, userId, 'dev', 'approved');
}