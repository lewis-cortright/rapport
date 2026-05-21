import cors from 'cors';
import express from 'express';
import helmet, { type HelmetOptions } from 'helmet';
import { env, type RuntimeEnv } from './config/env.js';
import { createRequireAuthenticatedUser } from './http/authentication.js';
import { createAuthRouter } from './routes/auth.js';
import { createChannelRouter } from './routes/channels.js';
import { createMessageRouter } from './routes/messages.js';
import { createSystemRouter } from './routes/system.js';
import { createWorkspaceRouter } from './routes/workspaces.js';
import { createAuthService, type AuthService } from './services/auth.js';
import { createChannelService, type ChannelService } from './services/channels.js';
import { getDatabaseHealth, type DatabaseHealth } from './services/db.js';
import { createMessageService, type MessageService } from './services/messages.js';
import { createWorkspaceService, type WorkspaceService } from './services/workspaces.js';

type CreateAppOptions = {
  runtimeEnv?: RuntimeEnv;
  authService?: AuthService;
  channelService?: ChannelService;
  messageService?: MessageService;
  workspaceService?: WorkspaceService;
  getDatabaseHealth?: () => DatabaseHealth;
  getUptimeSeconds?: () => number;
  now?: () => string;
  helmetOptions?: HelmetOptions;
  /** Pass Infinity to disable auth rate limiting in test environments. */
  authRateLimitMax?: number;
  /** Override the auth rate-limit window in milliseconds. */
  authRateLimitWindowMs?: number;
};

/**
 * Creates the configured Express application used by both the production server
 * entry point and the test suite.
 */
export function createApp(options: CreateAppOptions = {}) {
  // Compose concrete services once here so the HTTP layer stays thin and tests
  // can still inject focused doubles for each domain.
  const runtimeEnv = options.runtimeEnv ?? env;
  const authService = options.authService ?? createAuthService({ runtimeEnv });
  const channelService = options.channelService ?? createChannelService();
  const messageService = options.messageService ?? createMessageService();
  const workspaceService =
    options.workspaceService ??
    createWorkspaceService({
      provisionDefaultChannel: channelService.provisionDefaultChannelForWorkspace.bind(channelService)
    });
  const resolveDatabaseHealth = options.getDatabaseHealth ?? getDatabaseHealth;
  const getUptimeSeconds = options.getUptimeSeconds ?? (() => Math.round(process.uptime()));
  const now = options.now ?? (() => new Date().toISOString());
  const requireAuthenticatedUser = createRequireAuthenticatedUser(authService);
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

  // Mount the more specific nested resources before their parent routers so
  // Express resolves `/messages` requests against the message router first.
  app.use('/api/auth', createAuthRouter({
    authService,
    requireAuthenticatedUser,
    authRateLimitMax: options.authRateLimitMax,
    authRateLimitWindowMs: options.authRateLimitWindowMs
  }));
  app.use('/api/workspaces/:workspaceId/channels/:channelId/messages', createMessageRouter({ messageService, requireAuthenticatedUser }));
  app.use('/api/workspaces/:workspaceId/channels', createChannelRouter({ channelService, requireAuthenticatedUser }));
  app.use('/api/workspaces', createWorkspaceRouter({ workspaceService, requireAuthenticatedUser }));
  // System routes stay last because they do not participate in the protected
  // domain-resource hierarchy above.
  app.use(createSystemRouter({ runtimeEnv, getDatabaseHealth: resolveDatabaseHealth, getUptimeSeconds, now }));

  return app;
}

