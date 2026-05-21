import cors from 'cors';
import express from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import { env, type RuntimeEnv } from './config/env.js';
import { AuthServiceError, createAuthService, extractBearerToken, type AuthService } from './services/auth.js';
import { getDatabaseHealth, type DatabaseHealth } from './services/db.js';
import { WorkspaceServiceError, createWorkspaceService, type WorkspaceService } from './services/workspaces.js';

type CreateAppOptions = {
  runtimeEnv?: RuntimeEnv;
  authService?: AuthService;
  workspaceService?: WorkspaceService;
  getDatabaseHealth?: () => DatabaseHealth;
  getUptimeSeconds?: () => number;
  now?: () => string;
  helmetOptions?: HelmetOptions;
};

/**
 * Creates the configured Express application used by both the production server
 * entry point and the test suite.
 */
export function createApp(options: CreateAppOptions = {}) {
  const runtimeEnv = options.runtimeEnv ?? env;
  const authService = options.authService ?? createAuthService({ runtimeEnv });
  const workspaceService = options.workspaceService ?? createWorkspaceService();
  const resolveDatabaseHealth = options.getDatabaseHealth ?? getDatabaseHealth;
  const getUptimeSeconds = options.getUptimeSeconds ?? (() => Math.round(process.uptime()));
  const now = options.now ?? (() => new Date().toISOString());
  const app = express();

  /**
   * Converts expected auth service failures into stable API responses while
   * preserving a generic 500 payload for unexpected exceptions.
   */
  function sendServiceError(error: unknown, response: express.Response, unexpectedMessage: string) {
    if (error instanceof AuthServiceError || error instanceof WorkspaceServiceError) {
      response.status(error.statusCode).json({
        ok: false,
        error: error.message
      });

      return;
    }

    response.status(500).json({
      ok: false,
      error: unexpectedMessage
    });
  }

  async function requireAuthenticatedUser(request: express.Request, response: express.Response) {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      response.status(401).json({
        ok: false,
        error: 'Authentication token is required.'
      });

      return null;
    }

    try {
      return await authService.getCurrentUser(token);
    } catch (error) {
      sendServiceError(error, response, 'An unexpected authentication error occurred.');

      return null;
    }
  }

  app.set('trust proxy', 1);
  app.use(helmet(options.helmetOptions));
  app.use(
    cors({
      origin: runtimeEnv.corsOrigin,
      credentials: true
    })
  );
  app.use(express.json());

  app.post('/api/auth/register', async (request, response) => {
    try {
      const result = await authService.register(request.body);

      response.status(201).json({
        ok: true,
        ...result
      });
    } catch (error) {
      sendServiceError(error, response, 'An unexpected authentication error occurred.');
    }
  });

  app.post('/api/auth/login', async (request, response) => {
    try {
      const result = await authService.login(request.body);

      response.json({
        ok: true,
        ...result
      });
    } catch (error) {
      sendServiceError(error, response, 'An unexpected authentication error occurred.');
    }
  });

  app.get('/api/auth/me', async (request, response) => {
    const user = await requireAuthenticatedUser(request, response);

    if (!user) {
      return;
    }

    response.json({
      ok: true,
      user
    });
  });

  app.get('/api/workspaces', async (request, response) => {
    const user = await requireAuthenticatedUser(request, response);

    if (!user) {
      return;
    }

    try {
      const workspaces = await workspaceService.listWorkspacesForUser(user);

      response.json({
        ok: true,
        workspaces
      });
    } catch (error) {
      sendServiceError(error, response, 'An unexpected workspace error occurred.');
    }
  });

  app.post('/api/workspaces', async (request, response) => {
    const user = await requireAuthenticatedUser(request, response);

    if (!user) {
      return;
    }

    try {
      const workspace = await workspaceService.createWorkspaceForUser(user, request.body);

      response.status(201).json({
        ok: true,
        workspace
      });
    } catch (error) {
      sendServiceError(error, response, 'An unexpected workspace error occurred.');
    }
  });

  app.post('/api/workspaces/join', async (request, response) => {
    const user = await requireAuthenticatedUser(request, response);

    if (!user) {
      return;
    }

    try {
      const workspace = await workspaceService.joinWorkspaceForUser(user, request.body);

      response.json({
        ok: true,
        workspace
      });
    } catch (error) {
      sendServiceError(error, response, 'An unexpected workspace error occurred.');
    }
  });

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

