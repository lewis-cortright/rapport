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

import { AppPage } from './AppPage';
import { fetchCurrentUser } from '../services/authApi';
import { createWorkspace, fetchWorkspaces, joinWorkspace } from '../services/workspaceApi';
import { renderWithProviders } from '../test/test-utils';

describe('AppPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(screen.getByText(/Theme mode: light/i)).toBeInTheDocument();
    expect(screen.getByText('/api')).toBeInTheDocument();
    expect(screen.getByText(window.location.origin)).toBeInTheDocument();
    expect(screen.getByText('# general')).toBeInTheDocument();
    expect(screen.getByText('CORE1234')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Product Team member/i }));

    expect(screen.getByRole('heading', { name: 'Product Team' })).toBeInTheDocument();
    expect(screen.getByText('PROD5678')).toBeInTheDocument();

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

    renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: { auth: { token: 'jwt.token' } }
    });

    expect(await screen.findByText(/Signed in as restored-user/i)).toBeInTheDocument();
    expect(vi.mocked(fetchCurrentUser)).toHaveBeenCalledWith('jwt.token');
    expect(await screen.findByText(/Active workspace: Rapport Core/i)).toBeInTheDocument();
    expect(vi.mocked(fetchWorkspaces)).toHaveBeenCalledWith('jwt.token');
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
    expect(screen.getByLabelText(/Workspace name/i)).toHaveValue('');

    await user.type(screen.getByLabelText(/Invite code/i), 'PROD5678');
    await user.click(screen.getByRole('button', { name: 'Join workspace' }));

    expect(await screen.findByText(/Active workspace: Product Team/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Invite code/i)).toHaveValue('');
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
});

