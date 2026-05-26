import type { Server as SocketServer, Socket } from 'socket.io';
import type { AuthService, AuthUser } from '../services/auth.js';
import { MessageServiceError, type MessageService, type MessageSummary } from '../services/messages.js';

/**
 * Shape of the authenticated user data attached to each socket after the
 * auth middleware runs.
 */
type SocketData = {
  user: AuthUser;
};

/**
 * Typed socket that carries the authenticated user in its data bag.
 */
type AuthenticatedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

/**
 * Events the client sends to the server.
 */
type ClientToServerEvents = {
  'channel:join': (payload: JoinPayload, ack: AckCallback) => void;
  'channel:leave': (payload: LeavePayload) => void;
  'message:send': (payload: SendMessagePayload, ack: AckCallback<MessageSummary>) => void;
  'message:edit': (payload: EditMessagePayload, ack: AckCallback<MessageSummary>) => void;
  'message:delete': (payload: DeleteMessagePayload, ack: AckCallback) => void;
  'typing:start': (payload: TypingPayload) => void;
  'typing:stop': (payload: TypingPayload) => void;
};

/**
 * Events the server emits to clients.
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

type JoinPayload = { workspaceId: string; channelId: string };
type LeavePayload = { workspaceId: string; channelId: string };
type SendMessagePayload = { workspaceId: string; channelId: string; content: string };
type EditMessagePayload = { workspaceId: string; channelId: string; messageId: string; content: string };
type DeleteMessagePayload = { workspaceId: string; channelId: string; messageId: string };
type TypingPayload = { workspaceId: string; channelId: string };

type AckResponse<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; data: T } | { ok: false; error: string };

type AckCallback<T = undefined> = (response: AckResponse<T>) => void;

/**
 * Derives the Socket.IO room name from a channel ID.  Channel IDs are globally
 * unique so a single prefix is sufficient.
 */
function channelRoom(channelId: string) {
  return `channel:${channelId}`;
}

/**
 * Extracts a user-facing error message from a service error or falls back to a
 * generic string so socket handlers do not leak internal stack traces.
 */
function resolveSocketError(error: unknown, fallback: string): string {
  if (error instanceof MessageServiceError) {
    return error.message;
  }

  return fallback;
}

type ChatDeps = {
  authService: AuthService;
  messageService: MessageService;
};

/**
 * Registers authenticated Socket.IO chat handlers on the given server instance.
 *
 * Authentication is enforced as a connection-level middleware that verifies the
 * JWT token provided in the handshake auth object.  Channel room joins are
 * guarded by a workspace membership check via the message service.  Messages are
 * persisted before being broadcast to the room so the REST history endpoint and
 * the real-time stream stay consistent.
 */
export function registerChatHandlers(io: SocketServer, deps: ChatDeps): void {
  const { authService, messageService } = deps;

  // Reject any connection that does not carry a valid JWT.
  io.use(async (socket, next) => {
    const token = (socket.handshake.auth as Record<string, unknown>)?.token;

    if (!token || typeof token !== 'string') {
      next(new Error('Authentication token is required.'));
      return;
    }

    try {
      const user = await authService.getCurrentUser(token);
      socket.data.user = user;
      next();
    } catch {
      next(new Error('Authentication failed.'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.data.user;

    // ------------------------------------------------------------------ //
    // channel:join — validate workspace membership then subscribe to room  //
    // ------------------------------------------------------------------ //
    socket.on('channel:join', async (payload, ack) => {
      const { workspaceId, channelId } = payload ?? {};

      if (!workspaceId || !channelId) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: 'workspaceId and channelId are required.' });
        }

        return;
      }

      try {
        await messageService.checkChannelAccess(user, workspaceId, channelId);
        await socket.join(channelRoom(channelId));
        socket.emit('channel:joined', { channelId });

        if (typeof ack === 'function') {
          ack({ ok: true });
        }
      } catch (error) {
        const message = resolveSocketError(error, 'Unable to join channel.');

        socket.emit('error', { event: 'channel:join', message });

        if (typeof ack === 'function') {
          ack({ ok: false, error: message });
        }
      }
    });

    // ------------------------------------------------------------------ //
    // channel:leave — unsubscribe from the channel room                   //
    // ------------------------------------------------------------------ //
    socket.on('channel:leave', ({ channelId } = {} as LeavePayload) => {
      if (!channelId) {
        return;
      }

      void socket.leave(channelRoom(channelId));
      socket.emit('channel:left', { channelId });
    });

    // ------------------------------------------------------------------ //
    // message:send — persist then broadcast to the entire channel room    //
    // ------------------------------------------------------------------ //
    socket.on('message:send', async (payload, ack) => {
      const { workspaceId, channelId, content } = payload ?? {};

      if (!workspaceId || !channelId || !content) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: 'workspaceId, channelId, and content are required.' });
        }

        return;
      }

      try {
        const message = await messageService.createMessageForUser(user, workspaceId, channelId, {
          content
        });

        // Broadcast to all clients in the channel room including the sender so
        // every session receives the confirmed, persisted message payload.
        io.to(channelRoom(channelId)).emit('message:new', message);

        if (typeof ack === 'function') {
          ack({ ok: true, data: message });
        }
      } catch (error) {
        const message = resolveSocketError(error, 'Unable to send the message.');

        if (typeof ack === 'function') {
          ack({ ok: false, error: message });
        }
      }
    });

    // ------------------------------------------------------------------ //
    // message:edit — validate ownership, persist update, broadcast        //
    // ------------------------------------------------------------------ //
    socket.on('message:edit', async (payload, ack) => {
      const { workspaceId, channelId, messageId, content } = payload ?? {};

      if (!workspaceId || !channelId || !messageId || !content) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: 'workspaceId, channelId, messageId, and content are required.' });
        }

        return;
      }

      try {
        const updated = await messageService.editMessageForUser(user, workspaceId, channelId, messageId, { content });

        io.to(channelRoom(channelId)).emit('message:updated', updated);

        if (typeof ack === 'function') {
          ack({ ok: true, data: updated });
        }
      } catch (error) {
        const msg = resolveSocketError(error, 'Unable to edit the message.');

        if (typeof ack === 'function') {
          ack({ ok: false, error: msg });
        }
      }
    });

    // ------------------------------------------------------------------ //
    // message:delete — validate ownership, remove, broadcast              //
    // ------------------------------------------------------------------ //
    socket.on('message:delete', async (payload, ack) => {
      const { workspaceId, channelId, messageId } = payload ?? {};

      if (!workspaceId || !channelId || !messageId) {
        if (typeof ack === 'function') {
          ack({ ok: false, error: 'workspaceId, channelId, and messageId are required.' });
        }

        return;
      }

      try {
        await messageService.deleteMessageForUser(user, workspaceId, channelId, messageId);

        io.to(channelRoom(channelId)).emit('message:deleted', { messageId, channelId });

        if (typeof ack === 'function') {
          ack({ ok: true });
        }
      } catch (error) {
        const msg = resolveSocketError(error, 'Unable to delete the message.');

        if (typeof ack === 'function') {
          ack({ ok: false, error: msg });
        }
      }
    });

    // ------------------------------------------------------------------ //
    // typing:start / typing:stop — relay presence to channel peers        //
    // The sender is excluded via socket.to() so clients do not see their  //
    // own typing indicator.                                                //
    // ------------------------------------------------------------------ //
    socket.on('typing:start', (payload) => {
      const { channelId } = payload ?? {};
      if (!channelId) return;
      socket.to(channelRoom(channelId)).emit('typing:update', {
        channelId,
        username: user.username,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (payload) => {
      const { channelId } = payload ?? {};
      if (!channelId) return;
      socket.to(channelRoom(channelId)).emit('typing:update', {
        channelId,
        username: user.username,
        isTyping: false,
      });
    });
  });
}

