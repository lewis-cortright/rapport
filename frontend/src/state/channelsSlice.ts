import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ChannelSummary } from '../services/channelApi';
import { clearCredentials, setCredentials } from './authSlice';

export type ChannelsState = {
  itemsByWorkspace: Record<string, ChannelSummary[]>;
  activeChannelIdByWorkspace: Record<string, string | null>;
  loadedWorkspaceIds: string[];
  status: 'idle' | 'loading';
  error: string | null;
};

const initialState: ChannelsState = {
  itemsByWorkspace: {},
  activeChannelIdByWorkspace: {},
  loadedWorkspaceIds: [],
  status: 'idle',
  error: null
};

type ChannelsRootState = {
  channels: ChannelsState;
};

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    setChannels(state, action: PayloadAction<{ workspaceId: string; channels: ChannelSummary[] }>) {
      const { workspaceId, channels } = action.payload;
      state.itemsByWorkspace[workspaceId] = channels;
      state.status = 'idle';
      state.error = null;

      if (!state.loadedWorkspaceIds.includes(workspaceId)) {
        state.loadedWorkspaceIds.push(workspaceId);
      }

      if (!channels.length) {
        state.activeChannelIdByWorkspace[workspaceId] = null;

        return;
      }

      const activeChannelId = state.activeChannelIdByWorkspace[workspaceId] ?? null;
      const activeStillExists = activeChannelId ? channels.some((channel) => channel.id === activeChannelId) : false;
      state.activeChannelIdByWorkspace[workspaceId] = activeStillExists ? activeChannelId : channels[0]?.id ?? null;
    },
    upsertChannel(state, action: PayloadAction<ChannelSummary>) {
      const workspaceId = action.payload.workspaceId;
      const channels = state.itemsByWorkspace[workspaceId] ?? [];
      const existingIndex = channels.findIndex((channel) => channel.id === action.payload.id);

      if (existingIndex === -1) {
        state.itemsByWorkspace[workspaceId] = [...channels, action.payload];
      } else {
        state.itemsByWorkspace[workspaceId] = channels.map((channel, index) => (index === existingIndex ? action.payload : channel));
      }

      if (!state.loadedWorkspaceIds.includes(workspaceId)) {
        state.loadedWorkspaceIds.push(workspaceId);
      }

      state.status = 'idle';
      state.error = null;
    },
    selectChannel(state, action: PayloadAction<{ workspaceId: string; channelId: string | null }>) {
      const { workspaceId, channelId } = action.payload;

      if (channelId === null) {
        state.activeChannelIdByWorkspace[workspaceId] = null;

        return;
      }

      const channels = state.itemsByWorkspace[workspaceId] ?? [];

      if (channels.some((channel) => channel.id === channelId)) {
        state.activeChannelIdByWorkspace[workspaceId] = channelId;
      }
    },
    setChannelPending(state) {
      state.status = 'loading';
      state.error = null;
    },
    setChannelError(state, action: PayloadAction<string>) {
      state.status = 'idle';
      state.error = action.payload;
    },
    clearChannelError(state) {
      state.error = null;
    },
    clearChannels() {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(setCredentials, () => initialState);
    builder.addCase(clearCredentials, () => initialState);
  }
});

export const {
  clearChannelError,
  clearChannels,
  selectChannel,
  setChannelError,
  setChannelPending,
  setChannels,
  upsertChannel
} = channelsSlice.actions;

export const channelsReducer = channelsSlice.reducer;

export function selectChannelItemsForWorkspace(state: ChannelsRootState, workspaceId: string | null) {
  return workspaceId ? state.channels.itemsByWorkspace[workspaceId] ?? [] : [];
}

export function selectActiveChannelIdForWorkspace(state: ChannelsRootState, workspaceId: string | null) {
  return workspaceId ? state.channels.activeChannelIdByWorkspace[workspaceId] ?? null : null;
}

export function selectActiveChannelForWorkspace(state: ChannelsRootState, workspaceId: string | null) {
  const channels = selectChannelItemsForWorkspace(state, workspaceId);
  const activeChannelId = selectActiveChannelIdForWorkspace(state, workspaceId);

  return channels.find((channel) => channel.id === activeChannelId) ?? null;
}

export function selectHasLoadedChannelsForWorkspace(state: ChannelsRootState, workspaceId: string | null) {
  return workspaceId ? state.channels.loadedWorkspaceIds.includes(workspaceId) : false;
}

export function selectChannelStatus(state: ChannelsRootState) {
  return state.channels.status;
}

export function selectChannelError(state: ChannelsRootState) {
  return state.channels.error;
}


