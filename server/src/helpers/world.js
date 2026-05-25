import db from '../database/connection.js';

export function isMember(worldId, userId) {
  return db
    .prepare(
      'SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND status = ?',
    )
    .get(worldId, userId, 'approved');
}

export function isDev(worldId, userId) {
  return db
    .prepare(
      'SELECT * FROM world_members WHERE world_id = ? AND user_id = ? AND role = ? AND status = ?',
    )
    .get(worldId, userId, 'dev', 'approved');
}

export function addCredits(worldId, userId, amount) {
  db.prepare(
    'UPDATE world_members SET credits = credits + ? WHERE world_id = ? AND user_id = ?',
  ).run(amount, worldId, userId);
}

export function validateWorldData(data) {
  if (!data.name || data.name.trim() === '') {
    return { isValid: false, error: 'Name is required' };
  }
  return { isValid: true };
}

export function formatWorldSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^0-9a-z-\s])/g, '')
    .replace(/(\s+)/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
