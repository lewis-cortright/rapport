import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/workspaceApi', () => ({
  createWorkspace: vi.fn(),
  fetchWorkspaces: vi.fn(),
  joinWorkspace: vi.fn()
}));

import { createWorkspace, fetchWorkspaces, joinWorkspace } from '../services/workspaceApi';
import { useWorkspaces } from './workspaces';
import { renderWithProviders } from '../test/test-utils';

function WorkspacesHarness() {
  const workspaces = useWorkspaces();

  return (
    <>
      <div data-testid="status">{workspaces.status}</div>
      <div data-testid="active-workspace">{workspaces.activeWorkspace?.name ?? 'none'}</div>
      <div data-testid="workspace-count">{workspaces.items.length}</div>
      <button
        onClick={() => {
          void workspaces.loadWorkspaces().catch(() => undefined);
        }}
      >
        Load workspaces
      </button>
      <button
        onClick={() => {
          void workspaces.createWorkspace({ name: 'Rapport Core' }).catch(() => undefined);
        }}
      >
        Create workspace
      </button>
      <button
        onClick={() => {
          void workspaces.joinWorkspace({ inviteCode: 'CORE1234' }).catch(() => undefined);
        }}
      >
        Join workspace
      </button>
      <button onClick={() => workspaces.selectWorkspace('workspace-2')}>Select workspace two</button>
      <button onClick={workspaces.clearError}>Clear workspace error</button>
    </>
  );
}

describe('useWorkspaces', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early for loadWorkspaces without a token and manages create/join/select flows', async () => {
    const user = userEvent.setup();
    const anonymous = renderWithProviders(<WorkspacesHarness />);

    await user.click(screen.getByRole('button', { name: 'Load workspaces' }));

    expect(vi.mocked(fetchWorkspaces)).not.toHaveBeenCalled();
    expect(anonymous.store.getState().workspaces.items).toEqual([]);
    anonymous.unmount();

    const { store } = renderWithProviders(<WorkspacesHarness />, {
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
        }
      }
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
    vi.mocked(createWorkspace).mockResolvedValueOnce({
      id: 'workspace-2',
      name: 'Product Team',
      inviteCode: 'PROD5678',
      role: 'owner',
      memberCount: 1,
      createdAt: '2026-05-21T00:10:00.000Z',
      updatedAt: '2026-05-21T00:10:00.000Z'
    });
    vi.mocked(joinWorkspace).mockResolvedValueOnce({
      id: 'workspace-3',
      name: 'Design Team',
      inviteCode: 'DESIGN12',
      role: 'member',
      memberCount: 4,
      createdAt: '2026-05-21T00:20:00.000Z',
      updatedAt: '2026-05-21T00:20:00.000Z'
    });

    await user.click(screen.getByRole('button', { name: 'Load workspaces' }));

    await waitFor(() => {
      expect(store.getState().workspaces.items).toHaveLength(1);
    });
    expect(vi.mocked(fetchWorkspaces)).toHaveBeenCalledWith('jwt.token');

    await user.click(screen.getByRole('button', { name: 'Create workspace' }));

    await waitFor(() => {
      expect(store.getState().workspaces.activeWorkspaceId).toBe('workspace-2');
    });

    await user.click(screen.getByRole('button', { name: 'Join workspace' }));

    await waitFor(() => {
      expect(store.getState().workspaces.activeWorkspaceId).toBe('workspace-3');
    });

    await user.click(screen.getByRole('button', { name: 'Select workspace two' }));

    expect(store.getState().workspaces.activeWorkspaceId).toBe('workspace-2');
    expect(screen.getByTestId('workspace-count')).toHaveTextContent('3');
  });

  it('stores user-facing errors and clears them when requested', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<WorkspacesHarness />, {
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
        }
      }
    });

    vi.mocked(createWorkspace).mockRejectedValueOnce(new Error('Workspace name must be at least 2 characters long.'));

    await user.click(screen.getByRole('button', { name: 'Create workspace' }));

    await waitFor(() => {
      expect(store.getState().workspaces.error).toBe('Workspace name must be at least 2 characters long.');
    });

    await user.click(screen.getByRole('button', { name: 'Clear workspace error' }));

    expect(store.getState().workspaces.error).toBeNull();
  });

  it('stores the fallback join-workspace error message for non-Error rejections', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<WorkspacesHarness />, {
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
        }
      }
    });

    vi.mocked(joinWorkspace).mockRejectedValueOnce('join failed');

    await user.click(screen.getByRole('button', { name: 'Join workspace' }));

    await waitFor(() => {
      expect(store.getState().workspaces.error).toBe('Unable to join the workspace.');
    });
  });

  it('reports missing-auth errors for create and join actions when no token exists', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<WorkspacesHarness />);

    await user.click(screen.getByRole('button', { name: 'Create workspace' }));

    await waitFor(() => {
      expect(store.getState().workspaces.error).toBe('Authentication token is required.');
    });

    store.dispatch({ type: 'workspaces/clearWorkspaceError' });
    await user.click(screen.getByRole('button', { name: 'Join workspace' }));

    await waitFor(() => {
      expect(store.getState().workspaces.error).toBe('Authentication token is required.');
    });
  });
});

