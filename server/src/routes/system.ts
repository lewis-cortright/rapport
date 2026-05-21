import { Router } from 'express';
import { createSystemController } from '../controllers/system.js';
import type { DatabaseHealth } from '../services/db.js';
import type { RuntimeEnv } from '../config/env.js';

type CreateSystemRouterOptions = {
  runtimeEnv: RuntimeEnv;
  getDatabaseHealth: () => DatabaseHealth;
  getUptimeSeconds: () => number;
  now: () => string;
};

/**
 * Registers infrastructure endpoints that are intentionally outside the domain
 * routers so readiness and scaffold checks remain simple.
 */
export function createSystemRouter(options: CreateSystemRouterOptions) {
  const controller = createSystemController(options);
  const router = Router();

  router.get('/api/health', controller.health);
  router.get('/', controller.root);

  return router;
}

