import request from 'supertest';
import { expect } from '@jest/globals';
import { createTestToken, createTestUser } from './auth.js';

export function compareStrings(left, right) {
  return left.localeCompare(right);
}

export function expectEventTitles(events, expectedTitles) {
  expect(events.map((event) => event.title).sort(compareStrings)).toEqual(
    [...expectedTitles].sort(compareStrings),
  );
}

export function expectCreatedEvent(response, expected) {
  expect(response.status).toBe(expected.statusCode);
  expect(response.body).toMatchObject(expected.body);
}

export function createEventsTestContext(db) {
  let userSeq = 0;

  function createWorld() {
    const worldResult = db
      .prepare(
        'INSERT INTO worlds (title, description, is_public) VALUES (?, ?, 1)',
      )
      .run('Events Test World', 'World used for events route tests');
    return Number(worldResult.lastInsertRowid);
  }

  function addMember(worldId, userId, role) {
    db.prepare(
      "INSERT INTO world_members (world_id, user_id, role, status, credits) VALUES (?, ?, ?, 'approved', 0)",
    ).run(worldId, userId, role);
  }

  function insertEvent(worldId, creatorId, fields = {}) {
    const event = {
      title: 'Default Event',
      description: '',
      eventType: 'small',
      status: 'proposed',
      startDate: null,
      endDate: null,
      ...fields,
    };

    const result = db
      .prepare(
        'INSERT INTO events (world_id, title, description, event_type, status, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      )
      .run(
        worldId,
        event.title,
        event.description,
        event.eventType,
        event.status,
        event.startDate,
        event.endDate,
        creatorId,
      );

    return Number(result.lastInsertRowid);
  }

  function createWorldAndMemberships() {
    userSeq += 1;
    const stamp = `u${Date.now()}_${userSeq}`;
    const dev = createTestUser({
      db,
      username: `dev_${stamp}`,
      email: `dev_${stamp}@example.com`,
      displayName: 'World Dev',
    });
    const player = createTestUser({
      db,
      username: `player_${stamp}`,
      email: `player_${stamp}@example.com`,
      displayName: 'World Player',
    });

    const worldId = createWorld();
    addMember(worldId, dev.id, 'dev');
    addMember(worldId, player.id, 'player');

    return {
      worldId,
      dev,
      player,
      devToken: createTestToken(dev),
      playerToken: createTestToken(player),
    };
  }

  function postEvent(app, worldId, token, payload) {
    return request(app)
      .post(`/api/events/world/${worldId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  function getProposed(app, worldId, token) {
    return request(app)
      .get(`/api/events/world/${worldId}/proposed`)
      .set('Authorization', `Bearer ${token}`);
  }

  function patchEvent(app, eventId, token, payload) {
    return request(app)
      .patch(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  return {
    createWorldAndMemberships,
    insertEvent,
    postEvent,
    getProposed,
    patchEvent,
  };
}
