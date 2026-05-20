import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';

describe('createApp', () => {
  it('returns a healthy response when the database is optional', async () => {
    const app = createApp({
      runtimeEnv: {
        nodeEnv: 'test',
        port: 4000,
        corsOrigin: 'http://localhost:5173',
        jwtSecret: 'secret',
        mongoUri: undefined,
        dbRequired: false
      },
      getDatabaseHealth: () => ({
        configured: false,
        required: false,
        connected: false,
        readyState: 0,
        lastError: 'not configured'
      }),
      getUptimeSeconds: () => 42,
      now: () => '2026-05-20T00:00:00.000Z',
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      status: 'ok',
      service: 'rapport-server',
      uptimeSeconds: 42,
      environment: 'test',
      database: {
        configured: false,
        required: false,
        connected: false,
        readyState: 0,
        lastError: 'not configured'
      },
      timestamp: '2026-05-20T00:00:00.000Z'
    });
  });

  it('returns a degraded response when the required database is unavailable', async () => {
    const app = createApp({
      runtimeEnv: {
        nodeEnv: 'test',
        port: 4000,
        corsOrigin: 'http://localhost:5173',
        jwtSecret: 'secret',
        mongoUri: 'mongodb://127.0.0.1:27017/rapport',
        dbRequired: true
      },
      getDatabaseHealth: () => ({
        configured: true,
        required: true,
        connected: false,
        readyState: 0,
        lastError: 'connection failed'
      }),
      getUptimeSeconds: () => 5,
      now: () => '2026-05-20T00:00:01.000Z',
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body.status).toBe('degraded');
    expect(response.body.ok).toBe(false);
  });

  it('returns the root scaffold payload', async () => {
    const app = createApp({
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      service: 'rapport-server',
      message: 'Server scaffold is running. Use /api/health for readiness details.'
    });
  });

  it('uses default health dependencies when no overrides are supplied', async () => {
    const app = createApp({
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.service).toBe('rapport-server');
    expect(typeof response.body.uptimeSeconds).toBe('number');
    expect(typeof response.body.timestamp).toBe('string');
    expect(response.body.database).toMatchObject({
      configured: false,
      required: false,
      connected: false
    });
  });
});

