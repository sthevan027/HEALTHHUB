import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('HealthHub API', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
  });

  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /water without body returns 400', async () => {
    const res = await request(app).post('/water').send({});
    expect(res.status).toBe(400);
  });

  it('GET /water without date returns 400', async () => {
    const res = await request(app).get('/water');
    expect(res.status).toBe(400);
  });

  it('GET /meals/week with invalid start returns 400', async () => {
    const res = await request(app).get('/meals/week?start=invalid');
    expect(res.status).toBe(400);
  });

  it('GET /meals/week without start returns 400', async () => {
    const res = await request(app).get('/meals/week');
    expect(res.status).toBe(400);
  });
});
