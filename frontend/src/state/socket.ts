import { useEffect, useRef, useCallback } from 'react';
import { appConfig } from '../config/appConfig';
import type { MessageSummary } from '../services/messageApi';
import { disconnectSocket, getSocket } from '../services/socketClient';
import { useAppDispatch, useAppSelector } from './hooks';
import { appendMessage } from './messagesSlice';
import { setUserTyping, clearTypingForChannel } from './typingSlice';

/**
 * Manages the Socket.IO connection lifecycle and active channel room membership
 * for the current authenticated session.
 *
 * - Connects when a token is available
 * - Joins the active channel room and leaves the previous one when selection changes
 * - Dispatches incoming `message:new` events to the Redux messages slice
 * - Dispatches incoming `typing:update` events to the Redux typing slice
 * - Disconnects cleanly when the token is cleared (logout)
 *
 * Returns a `sendTyping` function that emits `typing:start` or `typing:stop`
 * for the active channel so the caller can drive the typing indicator without
 * importing socket internals.
 *
 * Reconnect handling is delegated to the Socket.IO client library.  Duplicate
 * messages from the same session are deduplicated by ID inside the messages
 * slice reducer.
 */
export function useSocketChannel(): { sendTyping: (isTyping: boolean) => void } {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);
  const activeWorkspace = useAppSelector(
    (state: any) =>
      (state.workspaces.items as Array<{ id: string }>).find(
        (w) => w.id === state.workspaces.activeWorkspaceId
      ) ?? null
  );
  const activeChannel = useAppSelector((state: any) => {
    if (!activeWorkspace) return null;
    const channels: Array<{ id: string }> =
      state.channels.itemsByWorkspace[activeWorkspace.id] ?? [];
    const activeChannelId: string | null =
      state.channels.activeChannelIdByWorkspace[activeWorkspace.id] ?? null;
    return channels.find((c) => c.id === activeChannelId) ?? null;
  });

  // Track the currently joined room so we can leave it before joining the next.
  const joinedRoom = useRef<{ workspaceId: string; channelId: string } | null>(null);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      joinedRoom.current = null;
      return;
    }

    const socket = getSocket(appConfig.socketUrl, token);

    // ------------------------------------------------------------------
    // Leave the previously joined channel room if workspace/channel changed
    // ------------------------------------------------------------------
    const prev = joinedRoom.current;

    if (prev) {
      const channelChanged =
        !activeWorkspace ||
        !activeChannel ||
        prev.channelId !== activeChannel.id;

      if (channelChanged) {
        socket.emit('channel:leave', {
          workspaceId: prev.workspaceId,
          channelId: prev.channelId
        });
        // Clear stale typing indicators for the channel we are leaving.
        dispatch(clearTypingForChannel(prev.channelId));
        joinedRoom.current = null;
      }
    }

    // ------------------------------------------------------------------
    // Join the new channel room
    // ------------------------------------------------------------------
    if (activeWorkspace && activeChannel) {
      const alreadyJoined =
        joinedRoom.current?.channelId === activeChannel.id &&
        joinedRoom.current?.workspaceId === activeWorkspace.id;

      if (!alreadyJoined) {
        socket.emit(
          'channel:join',
          { workspaceId: activeWorkspace.id, channelId: activeChannel.id },
          (response) => {
            if (response.ok) {
              joinedRoom.current = {
                workspaceId: activeWorkspace.id,
                channelId: activeChannel.id
              };
            }
          }
        );
      }
    }

    // ------------------------------------------------------------------
    // message:new listener — deduplicated in the reducer
    // ------------------------------------------------------------------
    const handleMessage = (message: MessageSummary) => {
      dispatch(appendMessage(message));
    };

    socket.off('message:new', handleMessage);
    socket.on('message:new', handleMessage);

    // ------------------------------------------------------------------
    // typing:update listener — display who is typing in the active channel
    // ------------------------------------------------------------------
    const handleTypingUpdate = (payload: {
      channelId: string;
      username: string;
      isTyping: boolean;
    }) => {
      dispatch(setUserTyping(payload));
    };

    socket.off('typing:update', handleTypingUpdate);
    socket.on('typing:update', handleTypingUpdate);

    return () => {
      socket.off('message:new', handleMessage);
      socket.off('typing:update', handleTypingUpdate);
    };
  }, [token, activeWorkspace?.id, activeChannel?.id, dispatch]);

  /**
   * Emit a typing:start or typing:stop event for the currently active channel.
   * No-op when there is no active workspace/channel or socket connection.
   */
  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!token || !activeWorkspace || !activeChannel) return;
      const socket = getSocket(appConfig.socketUrl, token);
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', {
        workspaceId: activeWorkspace.id,
        channelId: activeChannel.id
      });
    },
    [token, activeWorkspace?.id, activeChannel?.id]
  );

  return { sendTyping };
}
