import { describe, expect, it, vi, beforeEach } from 'vitest';
import { registerChatHandlers } from './chat.js';
import type { AuthService, AuthUser } from '../services/auth.js';
import { MessageServiceError, type MessageService, type MessageSummary } from '../services/messages.js';

// ---------------------------------------------------------------------------
// Minimal fakes for Socket.IO Server and Socket
// ---------------------------------------------------------------------------

const TEST_USER: AuthUser = {
  id: 'user-1',
  username: 'alice',
  email: 'alice@example.com',
  createdAt: '2026-05-21T00:00:00.000Z',
  updatedAt: '2026-05-21T00:00:00.000Z'
};

const TEST_MESSAGE: MessageSummary = {
  id: 'msg-1',
  workspaceId: 'ws-1',
  channelId: 'ch-1',
  author: { id: 'user-1', username: 'alice', email: 'alice@example.com' },
  content: 'Hello world',
  createdAt: '2026-05-21T10:00:00.000Z',
  updatedAt: '2026-05-21T10:00:00.000Z'
};

/** Build a minimal mock AuthService. */
function buildAuthServiceMock(overrides: Partial<AuthService> = {}): AuthService {
  return {
    register: vi.fn(),
    login: vi.fn(),
    getCurrentUser: vi.fn(async () => TEST_USER),
    ...overrides
  };
}

/** Build a minimal mock MessageService. */
function buildMessageServiceMock(overrides: Partial<MessageService> = {}): MessageService {
  return {
    listMessagesForUser: vi.fn(),
    createMessageForUser: vi.fn(async () => TEST_MESSAGE),
    editMessageForUser: vi.fn(async () => TEST_MESSAGE),
    deleteMessageForUser: vi.fn(async () => undefined),
    checkChannelAccess: vi.fn(async () => undefined),
    ...overrides
  };
}

/**
 * A lightweight fake socket that captures emitted events and supports join/leave.
 */
function buildMockSocket(userData?: Partial<AuthUser>) {
  const events: Record<string, Array<(...args: unknown[]) => void>> = {};
  const emitted: Array<{ event: string; args: unknown[] }> = [];
  const peerBroadcasts: Array<{ room: string; event: string; args: unknown[] }> = [];
  const rooms = new Set<string>();

  const socket = {
    data: { user: userData ? ({ ...TEST_USER, ...userData } as AuthUser) : TEST_USER },
    handshake: { auth: { token: 'valid.token' } },
    on(event: string, handler: (...args: unknown[]) => void) {
      if (!events[event]) events[event] = [];
      events[event].push(handler);
    },
    emit(event: string, ...args: unknown[]) {
      emitted.push({ event, args });
    },
    /** Broadcast to room peers (excludes sender) — used for typing events. */
    to(room: string) {
      return {
        emit(event: string, ...args: unknown[]) {
          peerBroadcasts.push({ room, event, args });
        }
      };
    },
    join: vi.fn(async (room: string) => {
      rooms.add(room);
    }),
    leave: vi.fn(async (room: string) => {
      rooms.delete(room);
    }),
    /** Test helper — trigger a registered event handler. */
    trigger(event: string, ...args: unknown[]) {
      for (const handler of events[event] ?? []) {
        handler(...args);
      }
    },
    rooms,
    _emitted: emitted,
    _peerBroadcasts: peerBroadcasts
  };

  return socket;
}

/**
 * A lightweight fake Socket.IO Server that captures io.to() broadcasts and
 * collects middleware and connection handlers for manual invocation in tests.
 */
function buildMockIo() {
  const middlewares: Array<(socket: unknown, next: (err?: Error) => void) => void> = [];
  const connectionHandlers: Array<(socket: unknown) => void> = [];
  const broadcasts: Array<{ room: string; event: string; args: unknown[] }> = [];

  const io = {
    use(middleware: (socket: unknown, next: (err?: Error) => void) => void) {
      middlewares.push(middleware);
    },
    on(event: string, handler: (socket: unknown) => void) {
      if (event === 'connection') connectionHandlers.push(handler);
    },
    to(room: string) {
      return {
        emit(event: string, ...args: unknown[]) {
          broadcasts.push({ room, event, args });
        }
      };
    },
    /** Test helper — run all middlewares for a socket. */
    async runMiddleware(socket: unknown): Promise<Error | null> {
      return new Promise((resolve) => {
        let index = 0;

        function runNext(err?: Error) {
          if (err) {
            resolve(err);
            return;
          }

          const mw = middlewares[index++];

          if (!mw) {
            resolve(null);
            return;
          }

          void Promise.resolve(mw(socket, runNext));
        }

        runNext();
      });
    },
    /** Test helper — simulate a new connection. */
    async connect(socket: unknown): Promise<Error | null> {
      const err = await io.runMiddleware(socket);

      if (!err) {
        for (const handler of connectionHandlers) handler(socket);
      }

      return err;
    },
    _broadcasts: broadcasts
  };

  return io;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('registerChatHandlers', () => {
  let authService: AuthService;
  let messageService: MessageService;
  let io: ReturnType<typeof buildMockIo>;

  beforeEach(() => {
    vi.clearAllMocks();
    authService = buildAuthServiceMock();
    messageService = buildMessageServiceMock();
    io = buildMockIo();
    registerChatHandlers(io as never, { authService, messageService });
  });

  // ----------------------------------------------------------------------- //
  // Auth middleware                                                            //
  // ----------------------------------------------------------------------- //

  describe('auth middleware', () => {
    it('allows a connection with a valid token', async () => {
      const socket = buildMockSocket();
      const err = await io.runMiddleware(socket);

      expect(err).toBeNull();
      expect(authService.getCurrentUser).toHaveBeenCalledWith('valid.token');
      expect(socket.data.user).toEqual(TEST_USER);
    });

    it('rejects a connection with no token', async () => {
      const socket = buildMockSocket();
      socket.handshake.auth = { token: undefined as unknown as string };
      const err = await io.runMiddleware(socket);

      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Authentication token is required.');
    });

    it('rejects a connection when getCurrentUser throws', async () => {
      authService.getCurrentUser = vi.fn(async () => {
        throw new Error('token expired');
      });
      const socket = buildMockSocket();
      const err = await io.runMiddleware(socket);

      expect(err).toBeInstanceOf(Error);
      expect(err?.message).toBe('Authentication failed.');
    });
  });

  // ----------------------------------------------------------------------- //
  // channel:join                                                              //
  // ----------------------------------------------------------------------- //

  describe('channel:join', () => {
    it('joins the channel room and calls ack on success', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('channel:join', { workspaceId: 'ws-1', channelId: 'ch-1' }, ack);

      await vi.waitFor(() => expect(ack).toHaveBeenCalled());
      expect(ack).toHaveBeenCalledWith({ ok: true });
      expect(socket.join).toHaveBeenCalledWith('channel:ch-1');
      expect(socket._emitted).toContainEqual({ event: 'channel:joined', args: [{ channelId: 'ch-1' }] });
    });

    it('calls ack with error when channel access is denied', async () => {
      messageService.checkChannelAccess = vi.fn(async () => {
        throw new MessageServiceError('You do not have access to this workspace.', 403);
      });
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('channel:join', { workspaceId: 'ws-x', channelId: 'ch-x' }, ack);

      await vi.waitFor(() => expect(ack).toHaveBeenCalled());
      expect(ack).toHaveBeenCalledWith({
        ok: false,
        error: 'You do not have access to this workspace.'
      });
      expect(socket.join).not.toHaveBeenCalled();
    });

    it('calls ack with error when payload is missing fields', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('channel:join', {}, ack);

      await vi.waitFor(() => expect(ack).toHaveBeenCalled());
      expect(ack).toHaveBeenCalledWith({
        ok: false,
        error: 'workspaceId and channelId are required.'
      });
    });

    it('still emits error event to socket when access is denied', async () => {
      messageService.checkChannelAccess = vi.fn(async () => {
        throw new MessageServiceError('Access denied.', 403);
      });
      const socket = buildMockSocket();
      await io.connect(socket);

      socket.trigger('channel:join', { workspaceId: 'ws-x', channelId: 'ch-x' }, vi.fn());

      await vi.waitFor(() =>
        expect(socket._emitted).toContainEqual({
          event: 'error',
          args: [{ event: 'channel:join', message: 'Access denied.' }]
        })
      );
    });
  });

  // ----------------------------------------------------------------------- //
  // channel:leave                                                             //
  // ----------------------------------------------------------------------- //

  describe('channel:leave', () => {
    it('leaves the channel room', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      socket.trigger('channel:leave', { workspaceId: 'ws-1', channelId: 'ch-1' });

      await vi.waitFor(() => expect(socket.leave).toHaveBeenCalledWith('channel:ch-1'));
      expect(socket._emitted).toContainEqual({ event: 'channel:left', args: [{ channelId: 'ch-1' }] });
    });

    it('ignores a payload with no channelId', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      socket.trigger('channel:leave', {});

      expect(socket.leave).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------------------- //
  // message:send                                                              //
  // ----------------------------------------------------------------------- //

  describe('message:send', () => {
    it('persists the message and broadcasts to the channel room', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger(
        'message:send',
        { workspaceId: 'ws-1', channelId: 'ch-1', content: 'Hello world' },
        ack
      );

      await vi.waitFor(() => expect(ack).toHaveBeenCalled());
      expect(messageService.createMessageForUser).toHaveBeenCalledWith(
        TEST_USER,
        'ws-1',
        'ch-1',
        { content: 'Hello world' }
      );
      expect(ack).toHaveBeenCalledWith({ ok: true, data: TEST_MESSAGE });
      expect(io._broadcasts).toContainEqual({
        room: 'channel:ch-1',
        event: 'message:new',
        args: [TEST_MESSAGE]
      });
    });

    it('returns error ack when persistence fails', async () => {
      messageService.createMessageForUser = vi.fn(async () => {
        throw new MessageServiceError('Message content is required.', 400);
      });
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('message:send', { workspaceId: 'ws-1', channelId: 'ch-1', content: '   ' }, ack);

      await vi.waitFor(() => expect(ack).toHaveBeenCalled());
      expect(ack).toHaveBeenCalledWith({
        ok: false,
        error: 'Message content is required.'
      });
      expect(io._broadcasts).toHaveLength(0);
    });

    it('returns error ack when payload fields are missing', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('message:send', {}, ack);

      await vi.waitFor(() => expect(ack).toHaveBeenCalled());
      expect(ack).toHaveBeenCalledWith({
        ok: false,
        error: 'workspaceId, channelId, and content are required.'
      });
    });

    it('falls back to generic error message for unexpected failures', async () => {
      messageService.createMessageForUser = vi.fn(async () => {
        throw new Error('Unexpected DB failure');
      });
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger(
        'message:send',
        { workspaceId: 'ws-1', channelId: 'ch-1', content: 'Test' },
        ack
      );

      await vi.waitFor(() => expect(ack).toHaveBeenCalled());
      expect(ack).toHaveBeenCalledWith({
        ok: false,
        error: 'Unable to send the message.'
      });
    });
  });

  // ----------------------------------------------------------------------- //
  // typing:start / typing:stop                                                //
  // ----------------------------------------------------------------------- //

  describe('typing:start', () => {
    it('broadcasts typing:update { isTyping: true } to channel peers', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      socket.trigger('typing:start', { workspaceId: 'ws-1', channelId: 'ch-1' });

      expect(socket._peerBroadcasts).toContainEqual({
        room: 'channel:ch-1',
        event: 'typing:update',
        args: [{ channelId: 'ch-1', username: TEST_USER.username, isTyping: true }]
      });
    });

    it('ignores a payload with no channelId', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      socket.trigger('typing:start', {});

      expect(socket._peerBroadcasts).toHaveLength(0);
    });
  });

  describe('typing:stop', () => {
    it('broadcasts typing:update { isTyping: false } to channel peers', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      socket.trigger('typing:stop', { workspaceId: 'ws-1', channelId: 'ch-1' });

      expect(socket._peerBroadcasts).toContainEqual({
        room: 'channel:ch-1',
        event: 'typing:update',
        args: [{ channelId: 'ch-1', username: TEST_USER.username, isTyping: false }]
      });
    });

    it('ignores a payload with no channelId', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      socket.trigger('typing:stop', {});

      expect(socket._peerBroadcasts).toHaveLength(0);
    });
  });

  // ----------------------------------------------------------------------- //
  // message:edit                                                              //
  // ----------------------------------------------------------------------- //

  describe('message:edit', () => {
    it('edits a message and broadcasts message:updated to the channel room', async () => {
      const updatedMessage = { ...TEST_MESSAGE, content: 'Edited content' };
      messageService.editMessageForUser = vi.fn(async () => updatedMessage);

      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('message:edit', { workspaceId: 'ws-1', channelId: 'ch-1', messageId: 'msg-1', content: 'Edited content' }, ack);
      await vi.waitFor(() => expect(ack).toHaveBeenCalled());

      expect(ack).toHaveBeenCalledWith({ ok: true, data: updatedMessage });
      expect(io._broadcasts).toContainEqual({
        room: 'channel:ch-1',
        event: 'message:updated',
        args: [updatedMessage]
      });
    });

    it('acks with an error when the service rejects', async () => {
      messageService.editMessageForUser = vi.fn(async () => {
        throw new MessageServiceError('You can only edit your own messages.', 403);
      });

      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('message:edit', { workspaceId: 'ws-1', channelId: 'ch-1', messageId: 'msg-1', content: 'x' }, ack);
      await vi.waitFor(() => expect(ack).toHaveBeenCalled());

      expect(ack).toHaveBeenCalledWith({ ok: false, error: 'You can only edit your own messages.' });
      expect(io._broadcasts).toHaveLength(0);
    });

    it('acks with an error when required fields are missing', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('message:edit', { workspaceId: 'ws-1', channelId: 'ch-1' }, ack);
      await vi.waitFor(() => expect(ack).toHaveBeenCalled());

      expect(ack).toHaveBeenCalledWith({ ok: false, error: 'workspaceId, channelId, messageId, and content are required.' });
    });
  });

  // ----------------------------------------------------------------------- //
  // message:delete                                                            //
  // ----------------------------------------------------------------------- //

  describe('message:delete', () => {
    it('deletes a message and broadcasts message:deleted to the channel room', async () => {
      messageService.deleteMessageForUser = vi.fn(async () => undefined);

      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('message:delete', { workspaceId: 'ws-1', channelId: 'ch-1', messageId: 'msg-1' }, ack);
      await vi.waitFor(() => expect(ack).toHaveBeenCalled());

      expect(ack).toHaveBeenCalledWith({ ok: true });
      expect(io._broadcasts).toContainEqual({
        room: 'channel:ch-1',
        event: 'message:deleted',
        args: [{ messageId: 'msg-1', channelId: 'ch-1' }]
      });
    });

    it('acks with an error when the service rejects', async () => {
      messageService.deleteMessageForUser = vi.fn(async () => {
        throw new MessageServiceError('You can only delete your own messages.', 403);
      });

      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('message:delete', { workspaceId: 'ws-1', channelId: 'ch-1', messageId: 'msg-1' }, ack);
      await vi.waitFor(() => expect(ack).toHaveBeenCalled());

      expect(ack).toHaveBeenCalledWith({ ok: false, error: 'You can only delete your own messages.' });
      expect(io._broadcasts).toHaveLength(0);
    });

    it('acks with an error when required fields are missing', async () => {
      const socket = buildMockSocket();
      await io.connect(socket);

      const ack = vi.fn();
      socket.trigger('message:delete', { workspaceId: 'ws-1', channelId: 'ch-1' }, ack);
      await vi.waitFor(() => expect(ack).toHaveBeenCalled());

      expect(ack).toHaveBeenCalledWith({ ok: false, error: 'workspaceId, channelId, and messageId are required.' });
    });
  });
});


