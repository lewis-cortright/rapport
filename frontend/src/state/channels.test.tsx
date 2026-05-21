import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/channelApi', () => ({
  createChannel: vi.fn(),
  fetchChannels: vi.fn()
}));

import { createChannel, fetchChannels } from '../services/channelApi';
import { useChannels } from './channels';
import { renderWithProviders } from '../test/test-utils';

function ChannelsHarness() {
  const channels = useChannels();

  return (
    <>
      <div data-testid="status">{channels.status}</div>
      <div data-testid="active-channel">{channels.activeChannel?.name ?? 'none'}</div>
      <div data-testid="channel-count">{channels.items.length}</div>
      <button
        onClick={() => {
          void channels.loadChannels().catch(() => undefined);
        }}
      >
        Load channels
      </button>
      <button
        onClick={() => {
          void channels.createChannel({ name: 'frontend' }).catch(() => undefined);
        }}
      >
        Create channel
      </button>
      <button onClick={() => channels.selectChannel('channel-2')}>Select channel two</button>
      <button onClick={channels.clearError}>Clear channel error</button>
    </>
  );
}

describe('useChannels', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads and creates channels for the active workspace and tracks selection', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ChannelsHarness />, {
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'builder',
            email: 'builder@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
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

    vi.mocked(fetchChannels).mockResolvedValueOnce([
      {
        id: 'channel-1',
        workspaceId: 'workspace-1',
        name: 'general',
        createdAt: '2026-05-23T00:00:00.000Z',
        updatedAt: '2026-05-23T00:00:00.000Z'
      }
    ]);
    vi.mocked(createChannel).mockResolvedValueOnce({
      id: 'channel-2',
      workspaceId: 'workspace-1',
      name: 'frontend',
      createdAt: '2026-05-23T00:05:00.000Z',
      updatedAt: '2026-05-23T00:05:00.000Z'
    });

    await user.click(screen.getByRole('button', { name: 'Load channels' }));

    await waitFor(() => {
      expect(store.getState().channels.itemsByWorkspace['workspace-1']).toHaveLength(1);
    });
    expect(vi.mocked(fetchChannels)).toHaveBeenCalledWith('workspace-1', 'jwt.token');

    await user.click(screen.getByRole('button', { name: 'Create channel' }));

    await waitFor(() => {
      expect(store.getState().channels.activeChannelIdByWorkspace['workspace-1']).toBe('channel-2');
    });

    await user.click(screen.getByRole('button', { name: 'Select channel two' }));

    expect(screen.getByTestId('channel-count')).toHaveTextContent('2');
    expect(screen.getByTestId('active-channel')).toHaveTextContent('frontend');
  });

  it('returns early without an active workspace and stores missing-selection errors for create', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ChannelsHarness />, {
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'builder',
            email: 'builder@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        },
        workspaces: {
          hasLoaded: true
        }
      }
    });

    await user.click(screen.getByRole('button', { name: 'Load channels' }));

    expect(vi.mocked(fetchChannels)).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Create channel' }));

    await waitFor(() => {
      expect(store.getState().channels.error).toBe('Select a workspace before creating a channel.');
    });
  });

  it('stores user-facing channel errors and clears them when requested', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<ChannelsHarness />, {
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'builder',
            email: 'builder@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
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

    vi.mocked(createChannel).mockRejectedValueOnce(new Error('Channel name must be at least 2 characters long.'));

    await user.click(screen.getByRole('button', { name: 'Create channel' }));

    await waitFor(() => {
      expect(store.getState().channels.error).toBe('Channel name must be at least 2 characters long.');
    });

    await user.click(screen.getByRole('button', { name: 'Clear channel error' }));

    expect(store.getState().channels.error).toBeNull();
  });

  it('reports missing-auth and fallback non-Error failures consistently', async () => {
    const user = userEvent.setup();
    const anonymous = renderWithProviders(<ChannelsHarness />, {
      preloadedState: {
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

    await user.click(screen.getByRole('button', { name: 'Create channel' }));

    await waitFor(() => {
      expect(anonymous.store.getState().channels.error).toBe('Authentication token is required.');
    });
    anonymous.unmount();

    const { store } = renderWithProviders(<ChannelsHarness />, {
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'builder',
            email: 'builder@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
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

    vi.mocked(createChannel).mockRejectedValueOnce('create failed');

    await user.click(screen.getByRole('button', { name: 'Create channel' }));

    await waitFor(() => {
      expect(store.getState().channels.error).toBe('Unable to create the channel.');
    });
  });
});

