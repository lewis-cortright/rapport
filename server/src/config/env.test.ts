import { describe, expect, it } from 'vitest';
import { createEnv, parseBoolean } from './env';

describe('env config', () => {
  it('parses booleans with defaults', () => {
    expect(parseBoolean(undefined, true)).toBe(true);
    expect(parseBoolean('true', false)).toBe(true);
    expect(parseBoolean('FALSE', true)).toBe(false);
  });

  it('creates runtime config with defaults', () => {
    expect(createEnv({})).toEqual({
      nodeEnv: 'development',
      port: 4000,
      corsOrigin: 'http://localhost:5173',
      jwtSecret: '',
      mongoUri: undefined,
      dbRequired: false
    });
  });

  it('creates runtime config from provided values', () => {
    expect(
      createEnv({
        NODE_ENV: 'test',
        PORT: '9999',
        CORS_ORIGIN: 'https://rapport.example',
        JWT_SECRET: 'top-secret',
        MONGODB_URI: 'mongodb://127.0.0.1:27017/rapport',
        DB_REQUIRED: 'true'
      })
    ).toEqual({
      nodeEnv: 'test',
      port: 9999,
      corsOrigin: 'https://rapport.example',
      jwtSecret: 'top-secret',
      mongoUri: 'mongodb://127.0.0.1:27017/rapport',
      dbRequired: true
    });
  });
});

