import { describe, expect, it } from 'vitest';
import type { ChannelSummary } from '../services/channelApi';
import { clearCredentials, setCredentials } from './authSlice';
import {
  channelsReducer,
  clearChannelError,
  selectActiveChannelForWorkspace,
  selectChannel,
  setChannelError,
  setChannelPending,
  setChannels,
  upsertChannel
} from './channelsSlice';
import type { RootState } from './store';

const generalChannel: ChannelSummary = {
  id: 'channel-1',
  workspaceId: 'workspace-1',
  name: 'general',
  createdAt: '2026-05-23T00:00:00.000Z',
  updatedAt: '2026-05-23T00:00:00.000Z'
};

const frontendChannel: ChannelSummary = {
  id: 'channel-2',
  workspaceId: 'workspace-1',
  name: 'frontend',
  createdAt: '2026-05-23T00:05:00.000Z',
  updatedAt: '2026-05-23T00:05:00.000Z'
};

describe('channelsSlice', () => {
  it('loads channels, preserves valid active selection, and supports explicit selection clearing', () => {
    const loadedState = channelsReducer(undefined, setChannels({ workspaceId: 'workspace-1', channels: [generalChannel, frontendChannel] }));

    expect(loadedState.itemsByWorkspace['workspace-1']).toEqual([generalChannel, frontendChannel]);
    expect(loadedState.activeChannelIdByWorkspace['workspace-1']).toBe('channel-1');
    expect(loadedState.loadedWorkspaceIds).toContain('workspace-1');

    const selectedState = channelsReducer(loadedState, selectChannel({ workspaceId: 'workspace-1', channelId: 'channel-2' }));
    const preservedState = channelsReducer(selectedState, setChannels({ workspaceId: 'workspace-1', channels: [generalChannel, frontendChannel] }));
    const clearedState = channelsReducer(preservedState, selectChannel({ workspaceId: 'workspace-1', channelId: null }));

    expect(preservedState.activeChannelIdByWorkspace['workspace-1']).toBe('channel-2');
    expect(clearedState.activeChannelIdByWorkspace['workspace-1']).toBeNull();
  });

  it('upserts channels, ignores invalid selections, and exposes selector fallbacks', () => {
    const initial = channelsReducer(undefined, upsertChannel(generalChannel));
    const updated = channelsReducer(initial, upsertChannel({ ...generalChannel, updatedAt: '2026-05-23T00:10:00.000Z' }));
    const ignored = channelsReducer(updated, selectChannel({ workspaceId: 'workspace-1', channelId: 'missing-channel' }));

    const state: RootState = {
      auth: {
        token: null,
        user: null,
        status: 'idle',
        error: null
      },
      channels: ignored,
      messages: {
        itemsByChannel: {},
        loadedChannelIds: [],
        status: 'idle',
        error: null
      },
      workspaces: {
        items: [],
        activeWorkspaceId: null,
        status: 'idle',
        error: null,
        hasLoaded: false
      }
    };

    expect(updated.itemsByWorkspace['workspace-1']).toEqual([
      {
        ...generalChannel,
        updatedAt: '2026-05-23T00:10:00.000Z'
      }
    ]);
    expect(ignored.activeChannelIdByWorkspace['workspace-1']).toBeUndefined();
    expect(selectActiveChannelForWorkspace(state, 'workspace-1')).toBeNull();
    expect(selectActiveChannelForWorkspace(state, null)).toBeNull();
  });

  it('tracks pending/error states and resets on auth changes', () => {
    const pending = channelsReducer(undefined, setChannelPending());
    const errored = channelsReducer(pending, setChannelError('Unable to load channels.'));
    const cleared = channelsReducer(errored, clearChannelError());
    const afterLogin = channelsReducer(
      {
        itemsByWorkspace: { 'workspace-1': [generalChannel] },
        activeChannelIdByWorkspace: { 'workspace-1': 'channel-1' },
        loadedWorkspaceIds: ['workspace-1'],
        status: 'loading',
        error: 'old error'
      },
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
    const afterLogout = channelsReducer(afterLogin, clearCredentials());

    expect(pending.status).toBe('loading');
    expect(errored.error).toBe('Unable to load channels.');
    expect(cleared.error).toBeNull();
    expect(afterLogin).toEqual({
      itemsByWorkspace: {},
      activeChannelIdByWorkspace: {},
      loadedWorkspaceIds: [],
      status: 'idle',
      error: null
    });
    expect(afterLogout).toEqual(afterLogin);
  });
});

