import request from 'supertest';
import { createAppContext } from './helpers/appContext.js';

describe('Input Validation Tests', () => {
  const ctx = createAppContext();

  const validUser = {
    username: 'validuser',
    email: 'valid@example.com',
    password: 'Password123',
    display_name: 'Valid User',
  };

  describe('POST /api/users/register', () => {
    test('rejects missing username', async () => {
      const body = { ...validUser };
      delete body.username;
      const res = await request(ctx.app).post('/api/users/register').send(body);
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    test('rejects username shorter than 3 chars', async () => {
      const res = await request(ctx.app)
        .post('/api/users/register')
        .send({ ...validUser, username: 'ab' });
      expect(res.status).toBe(400);
    });

    test('rejects username with special characters', async () => {
      const res = await request(ctx.app)
        .post('/api/users/register')
        .send({ ...validUser, username: 'bad user!' });
      expect(res.status).toBe(400);
    });

    test('rejects invalid email format', async () => {
      const res = await request(ctx.app)
        .post('/api/users/register')
        .send({ ...validUser, email: 'not-an-email' });
      expect(res.status).toBe(400);
    });

    test('rejects password shorter than 6 chars', async () => {
      const res = await request(ctx.app)
        .post('/api/users/register')
        .send({ ...validUser, password: '12345' });
      expect(res.status).toBe(400);
    });

    test('rejects missing display_name', async () => {
      const body = { ...validUser };
      delete body.display_name;
      const res = await request(ctx.app).post('/api/users/register').send(body);
      expect(res.status).toBe(400);
    });

    test('accepts valid registration payload', async () => {
      const res = await request(ctx.app)
        .post('/api/users/register')
        .send(validUser);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
    });
  });

  describe('POST /api/users/login', () => {
    test('rejects missing username', async () => {
      const res = await request(ctx.app)
        .post('/api/users/login')
        .send({ password: 'pass' });
      expect(res.status).toBe(400);
    });

    test('rejects missing password', async () => {
      const res = await request(ctx.app)
        .post('/api/users/login')
        .send({ username: 'user' });
      expect(res.status).toBe(400);
    });

    test('rejects empty body', async () => {
      const res = await request(ctx.app).post('/api/users/login').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/worlds', () => {
    let token;

    beforeEach(async () => {
      const reg = await request(ctx.app).post('/api/users/register').send({
        username: 'worlddev',
        email: 'worlddev@example.com',
        password: 'Password123',
        display_name: 'World Dev',
      });
      token = reg.body.token;
    });

    test('rejects missing title', async () => {
      const res = await request(ctx.app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'No title' });
      expect(res.status).toBe(400);
    });

    test('accepts valid world creation', async () => {
      const res = await request(ctx.app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test World', description: 'A world', is_public: true });
      expect(res.status).toBe(201);
    });

    test('rejects is_public with non-boolean value', async () => {
      const res = await request(ctx.app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'World', is_public: 'yes' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/posts/event/:eventId', () => {
    let token;
    let eventId;

    beforeEach(async () => {
      const reg = await request(ctx.app).post('/api/users/register').send({
        username: 'postdev',
        email: 'postdev@example.com',
        password: 'Password123',
        display_name: 'Post Dev',
      });
      token = reg.body.token;

      const worldRes = await request(ctx.app)
        .post('/api/worlds')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Post World' });

      const eventRes = await request(ctx.app)
        .post(`/api/events/world/${worldRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test Event', event_type: 'big' });
      eventId = eventRes.body.id;
    });

    test('rejects missing content', async () => {
      const res = await request(ctx.app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(400);
    });

    test('rejects invalid image_url', async () => {
      const res = await request(ctx.app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Hello', image_url: 'not-a-url' });
      expect(res.status).toBe(400);
    });

    test('accepts valid post', async () => {
      const res = await request(ctx.app)
        .post(`/api/posts/event/${eventId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'My post content' });
      expect(res.status).toBe(201);
    });
  });
});
