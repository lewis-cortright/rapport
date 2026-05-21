import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { AuthServiceError, type AuthService } from './services/auth';
import { ChannelServiceError, type ChannelService, type ChannelSummary } from './services/channels';
import { MessageServiceError, type MessageService, type MessageSummary } from './services/messages';
import { WorkspaceServiceError, type WorkspaceService, type WorkspaceSummary } from './services/workspaces';

/**
 * Thin wrapper around createApp that disables auth rate limiting so tests can
 * make multiple requests to /api/auth/register and /api/auth/login in the same
 * test run without hitting the per-window limit.
 */
function createTestApp(options: Parameters<typeof createApp>[0] = {}) {
  return createApp({ authRateLimitMax: Infinity, ...options });
}

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

function createChannelServiceMock(overrides: Partial<ChannelService> = {}): ChannelService {
  const defaultChannel: ChannelSummary = {
    id: 'channel-1',
    workspaceId: 'workspace-1',
    name: 'general',
    createdAt: '2026-05-23T00:00:00.000Z',
    updatedAt: '2026-05-23T00:00:00.000Z'
  };
  const createdChannel: ChannelSummary = {
    id: 'channel-2',
    workspaceId: 'workspace-1',
    name: 'frontend',
    createdAt: '2026-05-23T00:05:00.000Z',
    updatedAt: '2026-05-23T00:05:00.000Z'
  };

  return {
    listChannelsForUser: vi.fn(async () => [defaultChannel, createdChannel]),
    createChannelForUser: vi.fn(async () => createdChannel),
    provisionDefaultChannelForWorkspace: vi.fn(async () => defaultChannel),
    ...overrides
  };
}

function createMessageServiceMock(overrides: Partial<MessageService> = {}): MessageService {
  const existingMessage: MessageSummary = {
    id: 'message-1',
    workspaceId: 'workspace-1',
    channelId: 'channel-1',
    author: {
      id: 'user-1',
      username: 'rapport-builder',
      email: 'builder@example.com'
    },
    content: 'Welcome to Rapport.',
    createdAt: '2026-05-24T00:00:00.000Z',
    updatedAt: '2026-05-24T00:00:00.000Z'
  };
  const createdMessage: MessageSummary = {
    id: 'message-2',
    workspaceId: 'workspace-1',
    channelId: 'channel-1',
    author: {
      id: 'user-1',
      username: 'rapport-builder',
      email: 'builder@example.com'
    },
    content: 'The persisted chat path is ready.',
    createdAt: '2026-05-24T00:05:00.000Z',
    updatedAt: '2026-05-24T00:05:00.000Z'
  };

  return {
    listMessagesForUser: vi.fn(async () => [existingMessage]),
    createMessageForUser: vi.fn(async () => createdMessage),
    checkChannelAccess: vi.fn(async () => undefined),
    ...overrides
  };
}

describe('createApp', () => {
  it('registers a user through the auth service', async () => {
    const authService = createAuthServiceMock();
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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

  it('lists workspace channels for an authenticated member', async () => {
    const authService = createAuthServiceMock();
    const channelService = createChannelServiceMock();
    const app = createTestApp({
      authService,
      channelService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/workspaces/workspace-1/channels').set('Authorization', 'Bearer jwt.token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      channels: [
        {
          id: 'channel-1',
          workspaceId: 'workspace-1',
          name: 'general',
          createdAt: '2026-05-23T00:00:00.000Z',
          updatedAt: '2026-05-23T00:00:00.000Z'
        },
        {
          id: 'channel-2',
          workspaceId: 'workspace-1',
          name: 'frontend',
          createdAt: '2026-05-23T00:05:00.000Z',
          updatedAt: '2026-05-23T00:05:00.000Z'
        }
      ]
    });
    expect(channelService.listChannelsForUser).toHaveBeenCalledWith(
      {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      },
      'workspace-1'
    );
  });

  it('creates a channel for an authenticated workspace owner', async () => {
    const authService = createAuthServiceMock();
    const channelService = createChannelServiceMock();
    const app = createTestApp({
      authService,
      channelService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .post('/api/workspaces/workspace-1/channels')
      .set('Authorization', 'Bearer jwt.token')
      .send({ name: 'frontend' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ok: true,
      channel: {
        id: 'channel-2',
        workspaceId: 'workspace-1',
        name: 'frontend',
        createdAt: '2026-05-23T00:05:00.000Z',
        updatedAt: '2026-05-23T00:05:00.000Z'
      }
    });
    expect(channelService.createChannelForUser).toHaveBeenCalledWith(
      {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      },
      'workspace-1',
      {
        name: 'frontend'
      }
    );
  });

  it('lists recent channel messages for an authenticated member', async () => {
    const authService = createAuthServiceMock();
    const messageService = createMessageServiceMock();
    const app = createTestApp({
      authService,
      messageService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .get('/api/workspaces/workspace-1/channels/channel-1/messages')
      .set('Authorization', 'Bearer jwt.token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      messages: [
        {
          id: 'message-1',
          workspaceId: 'workspace-1',
          channelId: 'channel-1',
          author: {
            id: 'user-1',
            username: 'rapport-builder',
            email: 'builder@example.com'
          },
          content: 'Welcome to Rapport.',
          createdAt: '2026-05-24T00:00:00.000Z',
          updatedAt: '2026-05-24T00:00:00.000Z'
        }
      ]
    });
    expect(messageService.listMessagesForUser).toHaveBeenCalledWith(
      {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      },
      'workspace-1',
      'channel-1'
    );
  });

  it('creates a message for an authenticated channel member', async () => {
    const authService = createAuthServiceMock();
    const messageService = createMessageServiceMock();
    const app = createTestApp({
      authService,
      messageService,
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .post('/api/workspaces/workspace-1/channels/channel-1/messages')
      .set('Authorization', 'Bearer jwt.token')
      .send({ content: 'The persisted chat path is ready.' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      ok: true,
      message: {
        id: 'message-2',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        author: {
          id: 'user-1',
          username: 'rapport-builder',
          email: 'builder@example.com'
        },
        content: 'The persisted chat path is ready.',
        createdAt: '2026-05-24T00:05:00.000Z',
        updatedAt: '2026-05-24T00:05:00.000Z'
      }
    });
    expect(messageService.createMessageForUser).toHaveBeenCalledWith(
      {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      },
      'workspace-1',
      'channel-1',
      {
        content: 'The persisted chat path is ready.'
      }
    );
  });

  it('rejects current-user requests without a bearer token', async () => {
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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

  it('rejects channel requests without a bearer token', async () => {
    const app = createTestApp({
      authService: createAuthServiceMock(),
      channelService: createChannelServiceMock(),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const listResponse = await request(app).get('/api/workspaces/workspace-1/channels');
    const createResponse = await request(app).post('/api/workspaces/workspace-1/channels').send({ name: 'frontend' });

    expect(listResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
    expect(listResponse.body).toEqual({
      ok: false,
      error: 'Authentication token is required.'
    });
    expect(createResponse.body).toEqual({
      ok: false,
      error: 'Authentication token is required.'
    });
  });

  it('rejects message requests without a bearer token', async () => {
    const app = createTestApp({
      authService: createAuthServiceMock(),
      messageService: createMessageServiceMock(),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const listResponse = await request(app).get('/api/workspaces/workspace-1/channels/channel-1/messages');
    const createResponse = await request(app)
      .post('/api/workspaces/workspace-1/channels/channel-1/messages')
      .send({ content: 'Hello world' });

    expect(listResponse.status).toBe(401);
    expect(createResponse.status).toBe(401);
    expect(listResponse.body).toEqual({
      ok: false,
      error: 'Authentication token is required.'
    });
    expect(createResponse.body).toEqual({
      ok: false,
      error: 'Authentication token is required.'
    });
  });

  it('maps auth service errors to HTTP responses', async () => {
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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

  it('maps channel service errors to HTTP responses', async () => {
    const app = createTestApp({
      authService: createAuthServiceMock(),
      channelService: createChannelServiceMock({
        createChannelForUser: vi.fn(async () => {
          throw new ChannelServiceError('Only workspace owners can create channels.', 403);
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .post('/api/workspaces/workspace-1/channels')
      .set('Authorization', 'Bearer jwt.token')
      .send({ name: 'frontend' });

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      ok: false,
      error: 'Only workspace owners can create channels.'
    });
  });

  it('returns a generic 500 payload for unexpected channel failures', async () => {
    const app = createTestApp({
      authService: createAuthServiceMock(),
      channelService: createChannelServiceMock({
        listChannelsForUser: vi.fn(async () => {
          throw new Error('channel list unavailable');
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app).get('/api/workspaces/workspace-1/channels').set('Authorization', 'Bearer jwt.token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      error: 'An unexpected channel error occurred.'
    });
  });

  it('maps message service errors to HTTP responses', async () => {
    const app = createTestApp({
      authService: createAuthServiceMock(),
      messageService: createMessageServiceMock({
        createMessageForUser: vi.fn(async () => {
          throw new MessageServiceError('Message content is required.', 400);
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .post('/api/workspaces/workspace-1/channels/channel-1/messages')
      .set('Authorization', 'Bearer jwt.token')
      .send({ content: '   ' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      ok: false,
      error: 'Message content is required.'
    });
  });

  it('returns a generic 500 payload for unexpected message failures', async () => {
    const app = createTestApp({
      authService: createAuthServiceMock(),
      messageService: createMessageServiceMock({
        listMessagesForUser: vi.fn(async () => {
          throw new Error('message list unavailable');
        })
      }),
      helmetOptions: { contentSecurityPolicy: false }
    });

    const response = await request(app)
      .get('/api/workspaces/workspace-1/channels/channel-1/messages')
      .set('Authorization', 'Bearer jwt.token');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      ok: false,
      error: 'An unexpected message error occurred.'
    });
  });

  it('returns a healthy response when the database is optional', async () => {
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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
    const app = createTestApp({
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

// ---------------------------------------------------------------------------
// Auth rate limiting
// ---------------------------------------------------------------------------

describe('auth rate limiting', () => {
  it('returns 429 after exceeding the configured max requests within a window', async () => {
    const authService = createAuthServiceMock({
      login: vi.fn(async () => {
        throw new AuthServiceError('Invalid credentials.', 401);
      })
    });

    // Create an app with a window of 1 hour but a max of 1 request so the
    // second request is immediately rate-limited regardless of timing.
    const app = createApp({
      authService,
      helmetOptions: { contentSecurityPolicy: false },
      authRateLimitWindowMs: 60 * 60 * 1000,
      authRateLimitMax: 1
    });

    const payload = { email: 'builder@example.com', password: 'wrong' };

    await request(app).post('/api/auth/login').send(payload);
    const response = await request(app).post('/api/auth/login').send(payload);

    expect(response.status).toBe(429);
    expect(response.body).toEqual({ ok: false, error: 'Too many requests. Please try again later.' });
  });
});
