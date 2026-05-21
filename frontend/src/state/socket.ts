import { useEffect, useRef } from 'react';
import { appConfig } from '../config/appConfig';
import type { MessageSummary } from '../services/messageApi';
import { disconnectSocket, getSocket } from '../services/socketClient';
import { useAppDispatch, useAppSelector } from './hooks';
import { appendMessage } from './messagesSlice';

/**
 * Manages the Socket.IO connection lifecycle and active channel room membership
 * for the current authenticated session.
 *
 * - Connects when a token is available
 * - Joins the active channel room and leaves the previous one when selection changes
 * - Dispatches incoming `message:new` events to the Redux messages slice
 * - Disconnects cleanly when the token is cleared (logout)
 *
 * Reconnect handling is delegated to the Socket.IO client library.  Duplicate
 * messages from the same session are deduplicated by ID inside the messages
 * slice reducer.
 */
export function useSocketChannel(): void {
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

    return () => {
      socket.off('message:new', handleMessage);
    };
  }, [token, activeWorkspace?.id, activeChannel?.id, dispatch]);
}

