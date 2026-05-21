import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { disconnectSocket, getSocket, isSocketConnected } from './socketClient';

// ---------------------------------------------------------------------------
// Mock socket.io-client
// ---------------------------------------------------------------------------
// We replace the `io` factory with a spy that returns a controllable fake socket
// so tests never open real network connections.
// ---------------------------------------------------------------------------

const mockDisconnect = vi.fn();
let mockConnected = false;

const buildMockSocket = () => ({
  disconnect: mockDisconnect,
  get connected() {
    return mockConnected;
  }
});

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => buildMockSocket())
}));

import { io } from 'socket.io-client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resetModule() {
  // The singleton lives inside the module; reset it between tests by
  // disconnecting any active socket so each test starts from a clean state.
  disconnectSocket();
  vi.clearAllMocks();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('socketClient', () => {
  beforeEach(() => {
    mockConnected = false;
    resetModule();
  });

  afterEach(() => {
    resetModule();
  });

  describe('getSocket', () => {
    it('creates a new socket with the correct url and token', () => {
      getSocket('http://localhost:4000', 'jwt.token');

      expect(io).toHaveBeenCalledWith('http://localhost:4000', {
        auth: { token: 'jwt.token' },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });
    });

    it('returns the same socket instance when called again with the same token', () => {
      const first = getSocket('http://localhost:4000', 'jwt.token');
      const second = getSocket('http://localhost:4000', 'jwt.token');

      expect(first).toBe(second);
      expect(io).toHaveBeenCalledTimes(1);
    });

    it('creates a new socket and disconnects the old one when the token changes', () => {
      const first = getSocket('http://localhost:4000', 'jwt.token-1');
      const second = getSocket('http://localhost:4000', 'jwt.token-2');

      // Old socket must be disconnected before the new one is created.
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(io).toHaveBeenCalledTimes(2);
      expect(first).not.toBe(second);
    });
  });

  describe('disconnectSocket', () => {
    it('disconnects the active socket and clears the cached instance', () => {
      getSocket('http://localhost:4000', 'jwt.token');
      disconnectSocket();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('is safe to call when no socket exists', () => {
      expect(() => disconnectSocket()).not.toThrow();
    });

    it('creates a fresh socket after disconnecting', () => {
      getSocket('http://localhost:4000', 'jwt.token');
      disconnectSocket();
      vi.clearAllMocks();

      getSocket('http://localhost:4000', 'jwt.token');
      expect(io).toHaveBeenCalledTimes(1);
    });
  });

  describe('isSocketConnected', () => {
    it('returns false when no socket has been created', () => {
      expect(isSocketConnected()).toBe(false);
    });

    it('reflects the connected state of the active socket', () => {
      getSocket('http://localhost:4000', 'jwt.token');

      mockConnected = false;
      expect(isSocketConnected()).toBe(false);

      mockConnected = true;
      expect(isSocketConnected()).toBe(true);
    });

    it('returns false after the socket is disconnected', () => {
      getSocket('http://localhost:4000', 'jwt.token');
      disconnectSocket();

      expect(isSocketConnected()).toBe(false);
    });
  });
});

