import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/authApi', () => ({
  fetchCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  registerAccount: vi.fn()
}));

vi.mock('../services/workspaceApi', () => ({
  createWorkspace: vi.fn(),
  fetchWorkspaces: vi.fn(),
  joinWorkspace: vi.fn()
}));

vi.mock('../services/channelApi', () => ({
  createChannel: vi.fn(),
  fetchChannels: vi.fn()
}));

vi.mock('../services/messageApi', () => ({
  createMessage: vi.fn(),
  fetchMessages: vi.fn()
}));

// ---------------------------------------------------------------------------
// Socket client mock
// ---------------------------------------------------------------------------
// The socket mock captures message:new listeners registered by useSocketChannel
// and provides a configurable emit implementation so individual tests can
// simulate socket acknowledgements and server-push events.
// ---------------------------------------------------------------------------

const mockSocketListeners = new Map<string, Array<(...args: unknown[]) => void>>();

type EmitHandler = (event: string, ...args: unknown[]) => void;
let mockEmitImpl: EmitHandler = (_event, ..._args) => undefined;

vi.mock('../services/socketClient', () => ({
  getSocket: vi.fn(() => ({
    on(event: string, handler: (...args: unknown[]) => void) {
      if (!mockSocketListeners.has(event)) mockSocketListeners.set(event, []);
      mockSocketListeners.get(event)!.push(handler);
    },
    off(event: string, handler: (...args: unknown[]) => void) {
      const handlers = mockSocketListeners.get(event) ?? [];
      mockSocketListeners.set(
        event,
        handlers.filter((h) => h !== handler)
      );
    },
    emit(event: string, ...args: unknown[]) {
      mockEmitImpl(event, ...args);
    },
    connected: true
  })),
  disconnectSocket: vi.fn(),
  isSocketConnected: vi.fn(() => true)
}));

import { AppPage } from './AppPage';
import { fetchCurrentUser } from '../services/authApi';
import { createChannel, fetchChannels } from '../services/channelApi';
import { fetchMessages } from '../services/messageApi';
import { createWorkspace, fetchWorkspaces, joinWorkspace } from '../services/workspaceApi';
import { renderWithProviders } from '../test/test-utils';

describe('AppPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketListeners.clear();
    // Default socket emit: channel:join always succeeds; message:send is a no-op.
    mockEmitImpl = (event, ...args) => {
      if (event === 'channel:join') {
        const ack = args[1] as ((r: { ok: boolean }) => void) | undefined;
        ack?.({ ok: true });
      }
    };
  });

  it('renders the app shell details, switches active workspaces, and logs out through Redux', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'redux-user',
            email: 'redux@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        },
        channels: {
          itemsByWorkspace: {
            'workspace-1': [
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
            ],
            'workspace-2': [
              {
                id: 'channel-3',
                workspaceId: 'workspace-2',
                name: 'general',
                createdAt: '2026-05-23T00:10:00.000Z',
                updatedAt: '2026-05-23T00:10:00.000Z'
              }
            ]
          },
          activeChannelIdByWorkspace: {
            'workspace-1': 'channel-1',
            'workspace-2': 'channel-3'
          },
          loadedWorkspaceIds: ['workspace-1', 'workspace-2']
        },
        messages: {
          itemsByChannel: {
            'channel-1': [
              {
                id: 'message-1',
                workspaceId: 'workspace-1',
                channelId: 'channel-1',
                author: {
                  id: 'user-1',
                  username: 'redux-user',
                  email: 'redux@example.com'
                },
                content: 'Welcome to Rapport.',
                createdAt: '2026-05-24T00:00:00.000Z',
                updatedAt: '2026-05-24T00:00:00.000Z'
              }
            ]
          },
          loadedChannelIds: ['channel-1', 'channel-3']
        },
        workspaces: {
          items: [
            {
              id: 'workspace-1',
              name: 'Rapport Core',
              inviteCode: 'CORE1234',
              role: 'owner',
              memberCount: 1,
              createdAt: '2026-05-21T00:00:00.000Z',
              updatedAt: '2026-05-21T00:00:00.000Z'
            },
            {
              id: 'workspace-2',
              name: 'Product Team',
              inviteCode: 'PROD5678',
              role: 'member',
              memberCount: 3,
              createdAt: '2026-05-21T00:10:00.000Z',
              updatedAt: '2026-05-21T00:20:00.000Z'
            }
          ],
          activeWorkspaceId: 'workspace-1',
          hasLoaded: true
        }
      }
    });

    expect(screen.getByText(/Signed in as redux-user/i)).toBeInTheDocument();
    expect(screen.getByText(/Active workspace: Rapport Core/i)).toBeInTheDocument();
    expect(screen.getByText(/Active channel: #general/i)).toBeInTheDocument();
    expect(screen.getByText(/Theme mode: light/i)).toBeInTheDocument();
    expect(screen.getByText('/api')).toBeInTheDocument();
    expect(screen.getByText(window.location.origin)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /# general active channel/i })).toBeInTheDocument();
    expect(screen.getByText('CORE1234')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Rapport.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Product Team member/i }));

    expect(screen.getByRole('heading', { name: 'Product Team' })).toBeInTheDocument();
    expect(screen.getByText('PROD5678')).toBeInTheDocument();
    expect(screen.getByText(/Only workspace owners can create channels in this MVP./i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create channel' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

    expect(screen.getByText(/Theme mode: dark/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(store.getState().auth.token).toBeNull();
  });

  it('restores the current user when only a persisted token is available', async () => {
    vi.mocked(fetchCurrentUser).mockResolvedValueOnce({
      id: 'user-1',
      username: 'restored-user',
      email: 'restored@example.com',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });
    vi.mocked(fetchWorkspaces).mockResolvedValueOnce([
      {
        id: 'workspace-1',
        name: 'Rapport Core',
        inviteCode: 'CORE1234',
        role: 'owner',
        memberCount: 1,
        createdAt: '2026-05-21T00:00:00.000Z',
        updatedAt: '2026-05-21T00:00:00.000Z'
      }
    ]);
    vi.mocked(fetchChannels).mockResolvedValueOnce([
      {
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      }
    ]);
    vi.mocked(fetchMessages).mockResolvedValueOnce([
      {
        id: 'message-1',
        workspaceId: 'workspace-1',
        channelId: 'channel-1',
        author: {
          id: 'user-1',
          username: 'restored-user',
          email: 'restored@example.com'
        },
        content: 'Welcome to Rapport.',
        createdAt: '2026-05-24T00:00:00.000Z',
        updatedAt: '2026-05-24T00:00:00.000Z'
      }
    ]);

    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: { auth: { token: 'jwt.token' } }
    });

    expect(await screen.findByText(/Signed in as restored-user/i)).toBeInTheDocument();
    expect(vi.mocked(fetchCurrentUser)).toHaveBeenCalledWith('jwt.token');
    expect(await screen.findByText(/Active workspace: Rapport Core/i)).toBeInTheDocument();
    expect(vi.mocked(fetchWorkspaces)).toHaveBeenCalledWith('jwt.token');
    expect(await screen.findByText(/Active channel: #general/i)).toBeInTheDocument();
    expect(vi.mocked(fetchChannels)).toHaveBeenCalledWith('workspace-1', 'jwt.token');
    expect(vi.mocked(fetchMessages)).toHaveBeenCalledWith('workspace-1', 'channel-1', 'jwt.token');
  });

  it('falls back to a generic member label when no token is present', () => {
    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: {
        workspaces: {
          hasLoaded: true
        }
      }
    });

    expect(screen.getByText(/Signed in as member/i)).toBeInTheDocument();
    expect(screen.getByText(/No workspaces yet/i)).toBeInTheDocument();
  });

  it('falls back to the user email when the username is blank', () => {
    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: '',
            email: 'fallback@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        }
      }
    });

    expect(screen.getByText(/Signed in as fallback@example.com/i)).toBeInTheDocument();
  });

  it('creates and joins workspaces from the sidebar forms', async () => {
    const user = userEvent.setup();
    vi.mocked(createWorkspace).mockResolvedValueOnce({
      id: 'workspace-1',
      name: 'Rapport Core',
      inviteCode: 'CORE1234',
      role: 'owner',
      memberCount: 1,
      createdAt: '2026-05-21T00:00:00.000Z',
      updatedAt: '2026-05-21T00:00:00.000Z'
    });
    vi.mocked(joinWorkspace).mockResolvedValueOnce({
      id: 'workspace-2',
      name: 'Product Team',
      inviteCode: 'PROD5678',
      role: 'member',
      memberCount: 3,
      createdAt: '2026-05-21T00:10:00.000Z',
      updatedAt: '2026-05-21T00:20:00.000Z'
    });
    vi.mocked(fetchChannels)
      .mockResolvedValueOnce([
        {
          id: 'channel-1',
          workspaceId: 'workspace-1',
          name: 'general',
          createdAt: '2026-05-23T00:00:00.000Z',
          updatedAt: '2026-05-23T00:00:00.000Z'
        }
      ])
      .mockResolvedValueOnce([
        {
          id: 'channel-2',
          workspaceId: 'workspace-2',
          name: 'general',
          createdAt: '2026-05-23T00:10:00.000Z',
          updatedAt: '2026-05-23T00:10:00.000Z'
        }
      ]);
    vi.mocked(fetchMessages)
      .mockResolvedValueOnce([
        {
          id: 'message-1',
          workspaceId: 'workspace-1',
          channelId: 'channel-1',
          author: {
            id: 'user-1',
            username: 'redux-user',
            email: 'redux@example.com'
          },
          content: 'Welcome to Rapport.',
          createdAt: '2026-05-24T00:00:00.000Z',
          updatedAt: '2026-05-24T00:00:00.000Z'
        }
      ])
      .mockResolvedValueOnce([
        {
          id: 'message-2',
          workspaceId: 'workspace-2',
          channelId: 'channel-2',
          author: {
            id: 'user-2',
            username: 'teammate',
            email: 'teammate@example.com'
          },
          content: 'Hello from product.',
          createdAt: '2026-05-24T00:10:00.000Z',
          updatedAt: '2026-05-24T00:10:00.000Z'
        }
      ]);

    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'redux-user',
            email: 'redux@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        },
        workspaces: {
          hasLoaded: true
        }
      }
    });

    await user.type(screen.getByLabelText(/Workspace name/i), 'Rapport Core');
    await user.click(screen.getByRole('button', { name: 'Create workspace' }));

    expect(await screen.findByText(/Active workspace: Rapport Core/i)).toBeInTheDocument();
    expect(await screen.findByText(/Active channel: #general/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Workspace name/i)).toHaveValue('');

    await user.type(screen.getByLabelText(/Invite code/i), 'PROD5678');
    await user.click(screen.getByRole('button', { name: 'Join workspace' }));

    expect(await screen.findByText(/Active workspace: Product Team/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Invite code/i)).toHaveValue('');
  });

  it('creates channels for owner workspaces and preserves the field when creation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(createChannel).mockResolvedValueOnce({
      id: 'channel-2',
      workspaceId: 'workspace-1',
      name: 'frontend',
      createdAt: '2026-05-23T00:05:00.000Z',
      updatedAt: '2026-05-23T00:05:00.000Z'
    });

    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'redux-user',
            email: 'redux@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        },
        channels: {
          itemsByWorkspace: {
            'workspace-1': [
              {
                id: 'channel-1',
                workspaceId: 'workspace-1',
                name: 'general',
                createdAt: '2026-05-23T00:00:00.000Z',
                updatedAt: '2026-05-23T00:00:00.000Z'
              }
            ]
          },
          activeChannelIdByWorkspace: {
            'workspace-1': 'channel-1'
          },
          loadedWorkspaceIds: ['workspace-1']
        },
        workspaces: {
          items: [
            {
              id: 'workspace-1',
              name: 'Rapport Core',
              inviteCode: 'CORE1234',
              role: 'owner',
              memberCount: 1,
              createdAt: '2026-05-21T00:00:00.000Z',
              updatedAt: '2026-05-21T00:00:00.000Z'
            }
          ],
          activeWorkspaceId: 'workspace-1',
          hasLoaded: true
        }
      }
    });

    await user.type(screen.getByLabelText(/Channel name/i), 'frontend');
    await user.click(screen.getByRole('button', { name: 'Create channel' }));

    expect(await screen.findByText(/Active channel: #frontend/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Channel name/i)).toHaveValue('');

    vi.mocked(createChannel).mockRejectedValueOnce(new Error('A channel with that name already exists in this workspace.'));

    await user.type(screen.getByLabelText(/Channel name/i), 'general');
    await user.click(screen.getByRole('button', { name: 'Create channel' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('A channel with that name already exists in this workspace.');
    expect(screen.getByLabelText(/Channel name/i)).toHaveValue('general');
  });

  it('sends messages for the active channel and preserves the field when sending fails', async () => {
    const user = userEvent.setup();

    // Configure the socket to succeed on message:send.  The ack now carries
    // the server-confirmed MessageSummary (required by confirmOptimisticMessage)
    // and the message:new broadcast is also fired to exercise the dedup path.
    mockEmitImpl = (event, ...args) => {
      if (event === 'channel:join') {
        const ack = args[1] as ((r: { ok: boolean }) => void) | undefined;
        ack?.({ ok: true });
      } else if (event === 'message:send') {
        const payload = args[0] as { workspaceId: string; channelId: string; content: string };
        const ack = args[1] as ((r: { ok: boolean; data?: Record<string, unknown> }) => void) | undefined;
        // Build the confirmed message first so it can be included in the ack.
        const message = {
          id: 'msg-socket-1',
          workspaceId: payload.workspaceId,
          channelId: payload.channelId,
          author: { id: 'user-1', username: 'redux-user', email: 'redux@example.com' },
          content: payload.content,
          createdAt: '2026-05-24T00:05:00.000Z',
          updatedAt: '2026-05-24T00:05:00.000Z'
        };
        // Ack includes data so confirmOptimisticMessage can replace the temp entry.
        ack?.({ ok: true, data: message });
        // Deliver the message:new echo to all registered listeners (dedup test).
        for (const handler of mockSocketListeners.get('message:new') ?? []) {
          handler(message);
        }
      }
    };

    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'redux-user',
            email: 'redux@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        },
        channels: {
          itemsByWorkspace: {
            'workspace-1': [
              {
                id: 'channel-1',
                workspaceId: 'workspace-1',
                name: 'general',
                createdAt: '2026-05-23T00:00:00.000Z',
                updatedAt: '2026-05-23T00:00:00.000Z'
              }
            ]
          },
          activeChannelIdByWorkspace: {
            'workspace-1': 'channel-1'
          },
          loadedWorkspaceIds: ['workspace-1']
        },
        messages: {
          itemsByChannel: {
            'channel-1': []
          },
          loadedChannelIds: ['channel-1']
        },
        workspaces: {
          items: [
            {
              id: 'workspace-1',
              name: 'Rapport Core',
              inviteCode: 'CORE1234',
              role: 'owner',
              memberCount: 1,
              createdAt: '2026-05-21T00:00:00.000Z',
              updatedAt: '2026-05-21T00:00:00.000Z'
            }
          ],
          activeWorkspaceId: 'workspace-1',
          hasLoaded: true
        }
      }
    });

    await user.type(screen.getByPlaceholderText('Hello team'), 'Hello team');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByText('Hello team')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hello team')).toHaveValue('');

    // Reconfigure the socket to reject the next send so the failure path is covered.
    // Use a non-whitespace value so the send button is enabled and the socket is reached.
    mockEmitImpl = (event, ...args) => {
      if (event === 'channel:join') {
        const ack = args[1] as ((r: { ok: boolean }) => void) | undefined;
        ack?.({ ok: true });
      } else if (event === 'message:send') {
        const ack = args[1] as ((r: { ok: boolean; error?: string }) => void) | undefined;
        ack?.({ ok: false, error: 'Message content is required.' });
      }
    };

    await user.type(screen.getByPlaceholderText('Hello team'), 'bad-message');
    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Message content is required.');
    expect(screen.getByPlaceholderText('Hello team')).toHaveValue('bad-message');
  });

  it('keeps workspace form values when create and join submissions fail', async () => {
    const user = userEvent.setup();
    vi.mocked(createWorkspace).mockRejectedValueOnce(new Error('Workspace name must be at least 2 characters long.'));
    vi.mocked(joinWorkspace).mockRejectedValueOnce(new Error('Workspace invite code was not recognized.'));

    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'redux-user',
            email: 'redux@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        },
        workspaces: {
          hasLoaded: true
        }
      }
    });

    await user.type(screen.getByLabelText(/Workspace name/i), 'A');
    await user.click(screen.getByRole('button', { name: 'Create workspace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Workspace name must be at least 2 characters long.');
    expect(screen.getByLabelText(/Workspace name/i)).toHaveValue('A');

    await user.type(screen.getByLabelText(/Invite code/i), 'MISSING');
    await user.click(screen.getByRole('button', { name: 'Join workspace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Workspace invite code was not recognized.');
    expect(screen.getByLabelText(/Invite code/i)).toHaveValue('MISSING');
  });

  it('shows a typing indicator when a peer sends typing:update for the active channel', async () => {
    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'redux-user',
            email: 'redux@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        },
        channels: {
          itemsByWorkspace: {
            'workspace-1': [
              {
                id: 'channel-1',
                workspaceId: 'workspace-1',
                name: 'general',
                createdAt: '2026-05-23T00:00:00.000Z',
                updatedAt: '2026-05-23T00:00:00.000Z'
              }
            ]
          },
          activeChannelIdByWorkspace: { 'workspace-1': 'channel-1' },
          loadedWorkspaceIds: ['workspace-1']
        },
        messages: {
          itemsByChannel: { 'channel-1': [] },
          loadedChannelIds: ['channel-1']
        },
        // Seed typing state directly so the test doesn't depend on socket timing.
        typing: {
          typingByChannel: { 'channel-1': ['alice'] }
        },
        workspaces: {
          items: [
            {
              id: 'workspace-1',
              name: 'Rapport Core',
              inviteCode: 'CORE1234',
              role: 'member',
              memberCount: 2,
              createdAt: '2026-05-21T00:00:00.000Z',
              updatedAt: '2026-05-21T00:00:00.000Z'
            }
          ],
          activeWorkspaceId: 'workspace-1',
          hasLoaded: true
        }
      }
    });

    expect(await screen.findByText('alice is typing…')).toBeInTheDocument();
  });
});

