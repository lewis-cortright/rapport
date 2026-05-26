import { io, type Socket } from 'socket.io-client';
import type { MessageSummary } from './messageApi';

/**
 * Events the server emits to connected clients.
 */
type ServerToClientEvents = {
  'message:new': (message: MessageSummary) => void;
  'message:updated': (message: MessageSummary) => void;
  'message:deleted': (payload: { messageId: string; channelId: string }) => void;
  'channel:joined': (payload: { channelId: string }) => void;
  'channel:left': (payload: { channelId: string }) => void;
  'typing:update': (payload: { channelId: string; username: string; isTyping: boolean }) => void;
  error: (payload: { event: string; message: string }) => void;
};

/**
 * Events the client sends to the server.
 */
type ClientToServerEvents = {
  'channel:join': (
    payload: { workspaceId: string; channelId: string },
    ack: (response: AckResponse) => void
  ) => void;
  'channel:leave': (payload: { workspaceId: string; channelId: string }) => void;
  'message:send': (
    payload: { workspaceId: string; channelId: string; content: string },
    ack: (response: AckResponse<MessageSummary>) => void
  ) => void;
  'message:edit': (
    payload: { workspaceId: string; channelId: string; messageId: string; content: string },
    ack: (response: AckResponse<MessageSummary>) => void
  ) => void;
  'message:delete': (
    payload: { workspaceId: string; channelId: string; messageId: string },
    ack: (response: AckResponse) => void
  ) => void;
  'typing:start': (payload: { workspaceId: string; channelId: string }) => void;
  'typing:stop': (payload: { workspaceId: string; channelId: string }) => void;
};

type AckResponse<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string };

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let activeSocket: AppSocket | null = null;
let activeToken: string | null = null;

/**
 * Returns the shared socket instance for the given token, creating a new one
 * if the token has changed or no socket exists yet.  Reconnection is handled
 * automatically by Socket.IO.
 */
export function getSocket(url: string, token: string): AppSocket {
  if (activeSocket && activeToken === token) {
    return activeSocket;
  }

  if (activeSocket) {
    activeSocket.disconnect();
    activeSocket = null;
  }

  activeSocket = io(url, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  });

  activeToken = token;

  return activeSocket;
}

/**
 * Disconnects the shared socket and clears the cached instance.  Call this on
 * logout or when the token is revoked.
 */
export function disconnectSocket(): void {
  if (activeSocket) {
    activeSocket.disconnect();
    activeSocket = null;
  }

  activeToken = null;
}

/**
 * Returns whether a socket is currently connected.
 */
export function isSocketConnected(): boolean {
  return activeSocket?.connected ?? false;
}

