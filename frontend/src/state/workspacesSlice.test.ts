import { describe, expect, it } from 'vitest';
import { clearCredentials, setCredentials } from './authSlice';
import {
  clearWorkspaceError,
  clearWorkspaces,
  selectActiveWorkspace,
  selectActiveWorkspaceId,
  selectHasLoadedWorkspaces,
  selectWorkspace,
  selectWorkspaceError,
  selectWorkspaceItems,
  selectWorkspaceStatus,
  setWorkspaceError,
  setWorkspacePending,
  setWorkspaces,
  upsertWorkspace,
  workspacesReducer
} from './workspacesSlice';

const workspaceOne = {
  id: 'workspace-1',
  name: 'Rapport Core',
  inviteCode: 'CORE1234',
  role: 'owner' as const,
  memberCount: 1,
  createdAt: '2026-05-21T00:00:00.000Z',
  updatedAt: '2026-05-21T00:00:00.000Z'
};

const workspaceTwo = {
  id: 'workspace-2',
  name: 'Product Team',
  inviteCode: 'PROD5678',
  role: 'member' as const,
  memberCount: 3,
  createdAt: '2026-05-21T00:10:00.000Z',
  updatedAt: '2026-05-21T00:20:00.000Z'
};

describe('workspacesSlice', () => {
  it('stores workspace lists, preserves active selection when possible, and clears for empty results', () => {
    const loadedState = workspacesReducer(undefined, setWorkspaces([workspaceOne, workspaceTwo]));
    const selectedState = workspacesReducer(loadedState, selectWorkspace('workspace-2'));
    const refreshedState = workspacesReducer(selectedState, setWorkspaces([workspaceTwo, workspaceOne]));
    const emptiedState = workspacesReducer(refreshedState, setWorkspaces([]));
    const malformedState = workspacesReducer(undefined, setWorkspaces([{ ...workspaceOne, id: undefined as unknown as string }]));

    expect(loadedState.activeWorkspaceId).toBe('workspace-1');
    expect(selectedState.activeWorkspaceId).toBe('workspace-2');
    expect(refreshedState.activeWorkspaceId).toBe('workspace-2');
    expect(emptiedState.activeWorkspaceId).toBeNull();
    expect(emptiedState.items).toEqual([]);
    expect(malformedState.activeWorkspaceId).toBeNull();
  });

  it('handles upserts, loading, errors, invalid selections, and explicit clears', () => {
    const pendingState = workspacesReducer(undefined, setWorkspacePending());
    const errorState = workspacesReducer(pendingState, setWorkspaceError('Unable to load workspaces.'));
    const insertedState = workspacesReducer(errorState, upsertWorkspace(workspaceOne));
    const updatedState = workspacesReducer(insertedState, upsertWorkspace({ ...workspaceOne, memberCount: 2 }));
    const invalidSelectionState = workspacesReducer(updatedState, selectWorkspace('missing-workspace'));
    const nullSelectionState = workspacesReducer({ ...invalidSelectionState, activeWorkspaceId: 'workspace-1' }, selectWorkspace(null));
    const clearedErrorState = workspacesReducer({ ...nullSelectionState, error: 'temporary error' }, clearWorkspaceError());
    const clearedState = workspacesReducer(clearedErrorState, clearWorkspaces());

    expect(pendingState.status).toBe('loading');
    expect(errorState.error).toBe('Unable to load workspaces.');
    expect(insertedState.items).toHaveLength(1);
    expect(updatedState.items[0]?.memberCount).toBe(2);
    expect(invalidSelectionState.activeWorkspaceId).toBeNull();
    expect(nullSelectionState.activeWorkspaceId).toBeNull();
    expect(clearedErrorState.error).toBeNull();
    expect(clearedState).toEqual({
      items: [],
      activeWorkspaceId: null,
      status: 'idle',
      error: null,
      hasLoaded: false
    });
  });

  it('resets workspace state when auth credentials change and selects data from root state', () => {
    const loadedState = workspacesReducer(undefined, setWorkspaces([workspaceOne]));
    const afterLogin = workspacesReducer(
      loadedState,
      setCredentials({
        token: 'jwt.token',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      })
    );
    const state = {
      auth: {
        token: 'jwt.token',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        },
        status: 'idle' as const,
        error: null
      },
      channels: {
        itemsByWorkspace: {},
        activeChannelIdByWorkspace: {},
        loadedWorkspaceIds: [],
        status: 'idle' as const,
        error: null
      },
      messages: {
        itemsByChannel: {},
        loadedChannelIds: [],
        status: 'idle' as const,
        error: null
      },
      workspaces: {
        items: [workspaceOne, workspaceTwo],
        activeWorkspaceId: 'workspace-2',
        status: 'idle' as const,
        error: null,
        hasLoaded: true
      }
    };
    const resetState = workspacesReducer(state.workspaces, clearCredentials());

    expect(afterLogin).toEqual({
      items: [],
      activeWorkspaceId: null,
      status: 'idle',
      error: null,
      hasLoaded: false
    });
    expect(resetState).toEqual({
      items: [],
      activeWorkspaceId: null,
      status: 'idle',
      error: null,
      hasLoaded: false
    });
    expect(selectWorkspaceItems(state)).toEqual([workspaceOne, workspaceTwo]);
    expect(selectActiveWorkspaceId(state)).toBe('workspace-2');
    expect(selectActiveWorkspace(state)?.name).toBe('Product Team');
    expect(selectActiveWorkspace({ ...state, workspaces: { ...state.workspaces, activeWorkspaceId: 'missing-workspace' } })).toBeNull();
    expect(selectWorkspaceStatus(state)).toBe('idle');
    expect(selectWorkspaceError(state)).toBeNull();
    expect(selectHasLoadedWorkspaces(state)).toBe(true);
  });
});

