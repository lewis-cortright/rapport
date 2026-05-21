import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { AuthServiceError, type AuthService } from './services/auth';
import { WorkspaceServiceError, type WorkspaceService, type WorkspaceSummary } from './services/workspaces';

function createAuthServiceMock(overrides: Partial<AuthService> = {}): AuthService {
  return {
    register: vi.fn(async () => ({
      token: 'jwt.register',
      user: {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    })),
    login: vi.fn(async () => ({
      token: 'jwt.login',
      user: {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    })),
    getCurrentUser: vi.fn(async () => ({
      id: 'user-1',
      username: 'rapport-builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    })),
    ...overrides
  };
}

function createWorkspaceServiceMock(overrides: Partial<WorkspaceService> = {}): WorkspaceService {
  const createdWorkspace: WorkspaceSummary = {
    id: 'workspace-1',
    name: 'Rapport Core',
    inviteCode: 'CORE1234',
    role: 'owner',
    memberCount: 1,
    createdAt: '2026-05-21T00:00:00.000Z',
    updatedAt: '2026-05-21T00:00:00.000Z'
  };
  const joinedWorkspace: WorkspaceSummary = {
    id: 'workspace-2',
    name: 'Product Team',
    inviteCode: 'PROD5678',
    role: 'member',
    memberCount: 3,
    createdAt: '2026-05-21T00:00:00.000Z',
    updatedAt: '2026-05-21T00:00:00.000Z'
  };

  return {
    createWorkspaceForUser: vi.fn(async () => createdWorkspace),
    listWorkspacesForUser: vi.fn(async () => [createdWorkspace]),
    joinWorkspaceForUser: vi.fn(async () => joinedWorkspace),
    ...overrides
  };
}

describe('createApp', () => {
  it('registers a user through the auth service', async () => {
    const authService = createAuthServiceMock();
    const app = createApp({
      authService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).post('/api/auth/register').send({
      username: 'rapport-builder',
      email: 'builder@example.com',
      password: 'super-secret'
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ok: true,
      token: 'jwt.register',
      user: {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    });
    expect(authService.register).toHaveBeenCalledWith({
      username: 'rapport-builder',
      email: 'builder@example.com',
      password: 'super-secret'
    });
  });

  it('logs a user in through the auth service', async () => {
    const authService = createAuthServiceMock();
    const app = createApp({
      authService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'builder@example.com',
      password: 'super-secret'
    });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(authService.login).toHaveBeenCalledWith({
      email: 'builder@example.com',
      password: 'super-secret'
    });
  });

  it('loads the current user from a bearer token', async () => {
    const authService = createAuthServiceMock();
    const app = createApp({
      authService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer jwt.token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      user: {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    });
    expect(authService.getCurrentUser).toHaveBeenCalledWith('jwt.token');
  });

  it('lists the current user workspaces through the workspace service', async () => {
    const authService = createAuthServiceMock();
    const workspaceService = createWorkspaceServiceMock();
    const app = createApp({
      authService,
      workspaceService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/workspaces').set('Authorization', 'Bearer jwt.token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      workspaces: [
        {
          id: 'workspace-1',
          name: 'Rapport Core',
          inviteCode: 'CORE1234',
          role: 'owner',
          memberCount: 1,
          createdAt: '2026-05-21T00:00:00.000Z',
          updatedAt: '2026-05-21T00:00:00.000Z'
        }
      ]
    });
    expect(workspaceService.listWorkspacesForUser).toHaveBeenCalledWith({
      id: 'user-1',
      username: 'rapport-builder',
      email: 'builder@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });
  });

  it('creates a workspace for the authenticated user', async () => {
    const authService = createAuthServiceMock();
    const workspaceService = createWorkspaceServiceMock();
    const app = createApp({
      authService,
      workspaceService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .post('/api/workspaces')
      .set('Authorization', 'Bearer jwt.token')
      .send({ name: 'Rapport Core' });

    expect(response.status).toBe(201);
    expect(response.body.workspace).toMatchObject({
      name: 'Rapport Core',
      inviteCode: 'CORE1234',
      role: 'owner'
    });
    expect(workspaceService.createWorkspaceForUser).toHaveBeenCalledWith(
      {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      },
      {
        name: 'Rapport Core'
      }
    );
  });

  it('joins a workspace by invite code for the authenticated user', async () => {
    const authService = createAuthServiceMock();
    const workspaceService = createWorkspaceServiceMock();
    const app = createApp({
      authService,
      workspaceService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .post('/api/workspaces/join')
      .set('Authorization', 'Bearer jwt.token')
      .send({ inviteCode: 'prod5678' });

    expect(response.status).toBe(200);
    expect(response.body.workspace).toMatchObject({
      name: 'Product Team',
      inviteCode: 'PROD5678',
      role: 'member'
    });
    expect(workspaceService.joinWorkspaceForUser).toHaveBeenCalledWith(
      {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      },
      {
        inviteCode: 'prod5678'
      }
    );
  });

  it('rejects current-user requests without a bearer token', async () => {
    const app = createApp({
      authService: createAuthServiceMock(),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/auth/me').set('Authorization', 'Token no-bearer');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      ok: false,
      error: 'Authentication token is required.'
    });
  });

  it('rejects protected workspace requests without a bearer token', async () => {
    const app = createApp({
      authService: createAuthServiceMock(),
      workspaceService: createWorkspaceServiceMock(),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/workspaces');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      ok: false,
      error: 'Authentication token is required.'
    });
  });

  it('rejects workspace creation without a bearer token', async () => {
    const app = createApp({
      authService: createAuthServiceMock(),
      workspaceService: createWorkspaceServiceMock(),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).post('/api/workspaces').send({ name: 'Rapport Core' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      ok: false,
      error: 'Authentication token is required.'
    });
  });

  it('rejects workspace join requests without a bearer token', async () => {
    const app = createApp({
      authService: createAuthServiceMock(),
      workspaceService: createWorkspaceServiceMock(),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).post('/api/workspaces/join').send({ inviteCode: 'CORE1234' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      ok: false,
      error: 'Authentication token is required.'
    });
  });

  it('maps auth service errors to HTTP responses', async () => {
    const app = createApp({
      authService: createAuthServiceMock({
        register: vi.fn(async () => {
          throw new AuthServiceError('An account with that email already exists.', 409);
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).post('/api/auth/register').send({
      username: 'rapport-builder',
      email: 'builder@example.com',
      password: 'super-secret'
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      ok: false,
      error: 'An account with that email already exists.'
    });
  });

  it('returns a generic 500 payload for unexpected auth failures', async () => {
    const app = createApp({
      authService: createAuthServiceMock({
        login: vi.fn(async () => {
          throw new Error('unexpected failure');
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).post('/api/auth/login').send({
      email: 'builder@example.com',
      password: 'super-secret'
    });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      error: 'An unexpected authentication error occurred.'
    });
  });

  it('returns a generic 500 payload for unexpected current-user failures', async () => {
    const app = createApp({
      authService: createAuthServiceMock({
        getCurrentUser: vi.fn(async () => {
          throw new Error('unexpected me failure');
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer jwt.token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      error: 'An unexpected authentication error occurred.'
    });
  });

  it('maps workspace service errors to HTTP responses', async () => {
    const app = createApp({
      authService: createAuthServiceMock(),
      workspaceService: createWorkspaceServiceMock({
        joinWorkspaceForUser: vi.fn(async () => {
          throw new WorkspaceServiceError('Workspace invite code was not recognized.', 404);
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .post('/api/workspaces/join')
      .set('Authorization', 'Bearer jwt.token')
      .send({ inviteCode: 'missing' });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      ok: false,
      error: 'Workspace invite code was not recognized.'
    });
  });

  it('returns a generic 500 payload for unexpected workspace failures', async () => {
    const app = createApp({
      authService: createAuthServiceMock(),
      workspaceService: createWorkspaceServiceMock({
        createWorkspaceForUser: vi.fn(async () => {
          throw new Error('workspace unavailable');
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .post('/api/workspaces')
      .set('Authorization', 'Bearer jwt.token')
      .send({ name: 'Rapport Core' });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      error: 'An unexpected workspace error occurred.'
    });
  });

  it('returns a generic 500 payload for unexpected workspace list failures', async () => {
    const app = createApp({
      authService: createAuthServiceMock(),
      workspaceService: createWorkspaceServiceMock({
        listWorkspacesForUser: vi.fn(async () => {
          throw new Error('workspace list unavailable');
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/workspaces').set('Authorization', 'Bearer jwt.token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      error: 'An unexpected workspace error occurred.'
    });
  });

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

    expect(response.status).toBe(response.body.ok ? 200 : 503);
    expect(response.body.service).toBe('rapport-server');
    expect(typeof response.body.uptimeSeconds).toBe('number');
    expect(typeof response.body.timestamp).toBe('string');
    expect(response.body.status).toBe(response.body.ok ? 'ok' : 'degraded');
    expect(response.body.database).toEqual(
      expect.objectContaining({
        configured: expect.any(Boolean),
        required: expect.any(Boolean),
        connected: expect.any(Boolean),
        readyState: expect.any(Number)
      })
    );
  });
});

