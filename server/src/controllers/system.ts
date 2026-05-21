import type express from 'express';
import type { DatabaseHealth } from '../services/db.js';
import type { RuntimeEnv } from '../config/env.js';

type CreateSystemControllerOptions = {
  runtimeEnv: RuntimeEnv;
  getDatabaseHealth: () => DatabaseHealth;
  getUptimeSeconds: () => number;
  now: () => string;
};

/**
 * Provides infrastructure-oriented handlers such as health and root responses
 * that sit outside the authenticated domain-resource routes.
 */
export function createSystemController(options: CreateSystemControllerOptions) {
  return {
    health: (_request: express.Request, response: express.Response) => {
      const database = options.getDatabaseHealth();
      const healthy = !database.required || database.connected;

      response.status(healthy ? 200 : 503).json({
        ok: healthy,
        status: healthy ? 'ok' : 'degraded',
        service: 'rapport-server',
        uptimeSeconds: options.getUptimeSeconds(),
        environment: options.runtimeEnv.nodeEnv,
        database,
        timestamp: options.now()
      });
    },

    root: (_request: express.Request, response: express.Response) => {
      response.json({
        service: 'rapport-server',
        message: 'Server scaffold is running. Use /api/health for readiness details.'
      });
    }
  };
}

