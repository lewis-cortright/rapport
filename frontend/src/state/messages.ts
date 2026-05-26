import { useCallback, useMemo } from 'react';
import { fetchMessages } from '../services/messageApi';
import { appConfig } from '../config/appConfig';
import { getSocket } from '../services/socketClient';
import { useAppDispatch, useAppSelector } from './hooks';
import { selectToken, selectUser } from './authSlice';
import {
  addOptimisticMessage,
  clearMessageError,
  confirmOptimisticMessage,
  removeOptimisticMessage,
  setMessageError,
  setMessagePending,
  setMessages,
  type OptimisticMessageEntry
} from './messagesSlice';

const EMPTY_MESSAGES: OptimisticMessageEntry[] = [];

type MessagesContextValue = {
  items: OptimisticMessageEntry[];
  hasLoadedCurrentChannel: boolean;
  status: 'idle' | 'loading';
  error: string | null;
  loadMessages: () => Promise<void>;
  sendMessage: (input: { content: string }) => Promise<void>;
  clearError: () => void;
};

export function useMessages(): MessagesContextValue {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const currentUser = useAppSelector(selectUser);
  const activeWorkspace = useAppSelector(
    (state: any) => state.workspaces.items.find((workspace: any) => workspace.id === state.workspaces.activeWorkspaceId) ?? null
  );
  const resolvedActiveChannel = useAppSelector((state: any) => {
    if (!activeWorkspace) {
      return null;
    }

    const channels = state.channels.itemsByWorkspace[activeWorkspace.id] ?? [];
    const activeChannelId = state.channels.activeChannelIdByWorkspace[activeWorkspace.id] ?? null;

    return channels.find((channel: any) => channel.id === activeChannelId) ?? null;
  });
  const items = useAppSelector((state: any) => (resolvedActiveChannel ? state.messages.itemsByChannel[resolvedActiveChannel.id] ?? EMPTY_MESSAGES : EMPTY_MESSAGES));
  const hasLoadedCurrentChannel = useAppSelector(
    (state: any) => (resolvedActiveChannel ? state.messages.loadedChannelIds.includes(resolvedActiveChannel.id) : false)
  );
  const status = useAppSelector((state: any) => state.messages.status);
  const error = useAppSelector((state: any) => state.messages.error);

  const loadMessagesForActiveChannel = useCallback(async () => {
    if (!token || !activeWorkspace || !resolvedActiveChannel) {
      return;
    }

    dispatch(setMessagePending());

    try {
      const messages = await fetchMessages(activeWorkspace.id, resolvedActiveChannel.id, token);
      dispatch(setMessages({ channelId: resolvedActiveChannel.id, messages }));
    } catch (nextError) {
      dispatch(setMessageError(nextError instanceof Error ? nextError.message : 'Unable to load messages.'));
      throw nextError;
    }
  }, [activeWorkspace, dispatch, resolvedActiveChannel, token]);

  const sendMessageForActiveChannel = useCallback(
    async (input: { content: string }) => {
      if (!token) {
        const error = new Error('Authentication token is required.');
        dispatch(setMessageError(error.message));
        throw error;
      }

      if (!activeWorkspace || !resolvedActiveChannel) {
        const error = new Error('Select a channel before sending a message.');
        dispatch(setMessageError(error.message));
        throw error;
      }

      // ------------------------------------------------------------------
      // Optimistic update — show the message immediately before the server
      // round-trip completes so the sender has instant visual feedback.
      // ------------------------------------------------------------------
      const tempId = `opt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const now = new Date().toISOString();
      const optimisticEntry: OptimisticMessageEntry = {
        id: tempId,
        optimisticId: tempId,
        workspaceId: activeWorkspace.id,
        channelId: resolvedActiveChannel.id,
        content: input.content,
        createdAt: now,
        updatedAt: now,
        author: {
          id: currentUser?.id ?? '',
          username: currentUser?.username ?? 'You',
          email: currentUser?.email ?? ''
        }
      };

      dispatch(addOptimisticMessage(optimisticEntry));

      return new Promise<void>((resolve, reject) => {
        const socket = getSocket(appConfig.socketUrl, token);

        socket.emit(
          'message:send',
          {
            workspaceId: activeWorkspace.id,
            channelId: resolvedActiveChannel.id,
            content: input.content
          },
          (response) => {
            if (response.ok) {
              // Replace the optimistic entry with the server-confirmed message.
              // If the `message:new` broadcast already arrived (server emits the
              // broadcast before the ack), confirmOptimisticMessage handles the
              // dedup gracefully.
              dispatch(
                confirmOptimisticMessage({
                  tempId,
                  confirmed: response.data
                })
              );
              resolve();
            } else {
              // Remove the speculative entry so the user can correct and retry.
              dispatch(
                removeOptimisticMessage({
                  tempId,
                  channelId: resolvedActiveChannel.id
                })
              );
              dispatch(setMessageError(response.error ?? 'Unable to send the message.'));
              reject(new Error(response.error ?? 'Unable to send the message.'));
            }
          }
        );
      });
    },
    [activeWorkspace, currentUser, dispatch, resolvedActiveChannel, token]
  );

  const clearError = useCallback(() => {
    dispatch(clearMessageError());
  }, [dispatch]);

  return useMemo(
    () => ({
      items,
      hasLoadedCurrentChannel,
      status,
      error,
      loadMessages: loadMessagesForActiveChannel,
      sendMessage: sendMessageForActiveChannel,
      clearError
    }),
    [clearError, error, hasLoadedCurrentChannel, items, loadMessagesForActiveChannel, sendMessageForActiveChannel, status]
  );
}
