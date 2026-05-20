import cors from 'cors';
import express from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import { env, type RuntimeEnv } from './config/env.js';
import { getDatabaseHealth, type DatabaseHealth } from './services/db.js';

type CreateAppOptions = {
  runtimeEnv?: RuntimeEnv;
  getDatabaseHealth?: () => DatabaseHealth;
  getUptimeSeconds?: () => number;
  now?: () => string;
  helmetOptions?: HelmetOptions;
};

export function createApp(options: CreateAppOptions = {}) {
  const runtimeEnv = options.runtimeEnv ?? env;
  const resolveDatabaseHealth = options.getDatabaseHealth ?? getDatabaseHealth;
  const getUptimeSeconds = options.getUptimeSeconds ?? (() => Math.round(process.uptime()));
  const now = options.now ?? (() => new Date().toISOString());
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet(options.helmetOptions));
  app.use(
    cors({
      origin: runtimeEnv.corsOrigin,
      credentials: true
    })
  );
  app.use(express.json());

  app.get('/api/health', (_request, response) => {
    const database = resolveDatabaseHealth();
    const healthy = !database.required || database.connected;

    response.status(healthy ? 200 : 503).json({
      ok: healthy,
      status: healthy ? 'ok' : 'degraded',
      service: 'rapport-server',
      uptimeSeconds: getUptimeSeconds(),
      environment: runtimeEnv.nodeEnv,
      database,
      timestamp: now()
    });
  });

  app.get('/', (_request, response) => {
    response.json({
      service: 'rapport-server',
      message: 'Server scaffold is running. Use /api/health for readiness details.'
    });
  });

  return app;
}

