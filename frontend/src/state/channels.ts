import { useCallback, useMemo } from 'react';
import { createChannel, fetchChannels, type ChannelSummary } from '../services/channelApi';
import { selectToken } from './authSlice';
import {
  clearChannelError,
  selectChannel,
  setChannelError,
  setChannelPending,
  setChannels,
  upsertChannel
} from './channelsSlice';
import { useAppDispatch, useAppSelector } from './hooks';

const EMPTY_CHANNELS: ChannelSummary[] = [];

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type CreateChannelInput = {
  name: string;
};

type ChannelsContextValue = {
  items: ChannelSummary[];
  activeChannel: ChannelSummary | null;
  hasLoadedCurrentWorkspace: boolean;
  status: 'idle' | 'loading';
  error: string | null;
  loadChannels: () => Promise<void>;
  createChannel: (input: CreateChannelInput) => Promise<void>;
  selectChannel: (channelId: string) => void;
  clearError: () => void;
};

export function useChannels(): ChannelsContextValue {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const activeWorkspace = useAppSelector(
    (state) => state.workspaces.items.find((workspace) => workspace.id === state.workspaces.activeWorkspaceId) ?? null
  );
  const items = useAppSelector((state) => (activeWorkspace ? state.channels.itemsByWorkspace[activeWorkspace.id] ?? EMPTY_CHANNELS : EMPTY_CHANNELS));
  const activeChannel = useAppSelector((state) => {
    if (!activeWorkspace) {
      return null;
    }

    const channels = state.channels.itemsByWorkspace[activeWorkspace.id] ?? EMPTY_CHANNELS;
    const activeChannelId = state.channels.activeChannelIdByWorkspace[activeWorkspace.id] ?? null;

    return channels.find((channel) => channel.id === activeChannelId) ?? null;
  });
  const hasLoadedCurrentWorkspace = useAppSelector(
    (state) => (activeWorkspace ? state.channels.loadedWorkspaceIds.includes(activeWorkspace.id) : false)
  );
  const status = useAppSelector((state) => state.channels.status);
  const error = useAppSelector((state) => state.channels.error);

  const loadChannelsForActiveWorkspace = useCallback(async () => {
    if (!token || !activeWorkspace) {
      return;
    }

    dispatch(setChannelPending());

    try {
      const channels = await fetchChannels(activeWorkspace.id, token);
      dispatch(setChannels({ workspaceId: activeWorkspace.id, channels }));
    } catch (nextError) {
      dispatch(setChannelError(resolveErrorMessage(nextError, 'Unable to load channels.')));
      throw nextError;
    }
  }, [activeWorkspace, dispatch, token]);

  const createChannelForActiveWorkspace = useCallback(
    async (input: CreateChannelInput) => {
      if (!token) {
        const error = new Error('Authentication token is required.');
        dispatch(setChannelError(error.message));
        throw error;
      }

      if (!activeWorkspace) {
        const error = new Error('Select a workspace before creating a channel.');
        dispatch(setChannelError(error.message));
        throw error;
      }

      dispatch(setChannelPending());

      try {
        const channel = await createChannel(activeWorkspace.id, input, token);
        dispatch(upsertChannel(channel));
        dispatch(selectChannel({ workspaceId: activeWorkspace.id, channelId: channel.id }));
      } catch (nextError) {
        dispatch(setChannelError(resolveErrorMessage(nextError, 'Unable to create the channel.')));
        throw nextError;
      }
    },
    [activeWorkspace, dispatch, token]
  );

  const selectChannelById = useCallback(
    (channelId: string) => {
      if (!activeWorkspace) {
        return;
      }

      dispatch(selectChannel({ workspaceId: activeWorkspace.id, channelId }));
    },
    [activeWorkspace, dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearChannelError());
  }, [dispatch]);

  return useMemo(
    () => ({
      items,
      activeChannel,
      hasLoadedCurrentWorkspace,
      status,
      error,
      loadChannels: loadChannelsForActiveWorkspace,
      createChannel: createChannelForActiveWorkspace,
      selectChannel: selectChannelById,
      clearError
    }),
    [activeChannel, clearError, createChannelForActiveWorkspace, error, hasLoadedCurrentWorkspace, items, loadChannelsForActiveWorkspace, selectChannelById, status]
  );
}


