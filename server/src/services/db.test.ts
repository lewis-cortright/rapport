import { describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectToDatabase, createDatabaseService, disconnectFromDatabase, getDatabaseHealth } from './db';
import type { RuntimeEnv } from '../config/env';

type EventName = 'connected' | 'disconnected' | 'error';

function createMongooseMock() {
  let readyState = 0;
  const handlers: Record<EventName, Array<(error?: Error) => void>> = {
    connected: [],
    disconnected: [],
    error: []
  };

  const connection = {
    get readyState() {
      return readyState;
    },
    set readyState(value: number) {
      readyState = value;
    },
    on(event: EventName, handler: (error?: Error) => void) {
      handlers[event].push(handler);
    }
  };

  const mongooseMock = {
    connection,
    connect: vi.fn(async () => {
      connection.readyState = 1;
      handlers.connected.forEach((handler) => handler());
    }),
    disconnect: vi.fn(async () => {
      connection.readyState = 0;
      handlers.disconnected.forEach((handler) => handler());
    })
  };

  return {
    mongooseMock,
    emit(event: EventName, error?: Error) {
      handlers[event].forEach((handler) => handler(error));
    }
  };
}

function createRuntimeEnv(overrides: Partial<RuntimeEnv> = {}): RuntimeEnv {
  return {
    nodeEnv: 'test',
    port: 4000,
    corsOrigin: 'http://localhost:5173',
    jwtSecret: 'secret',
    mongoUri: undefined,
    dbRequired: false,
    ...overrides
  };
}

describe('createDatabaseService', () => {
  it('reports missing configuration when no URI is provided and the DB is optional', async () => {
    const { mongooseMock } = createMongooseMock();
    const service = createDatabaseService({
      mongooseInstance: mongooseMock,
      runtimeEnv: createRuntimeEnv()
    });

    await service.connect();

    expect(service.getHealth()).toEqual({
      configured: false,
      required: false,
      connected: false,
      readyState: 0,
      lastError: 'MONGODB_URI is not configured.'
    });
    expect(mongooseMock.connect).not.toHaveBeenCalled();
  });

  it('throws when no URI is provided and the DB is required', async () => {
    const { mongooseMock } = createMongooseMock();
    const service = createDatabaseService({
      mongooseInstance: mongooseMock,
      runtimeEnv: createRuntimeEnv({ dbRequired: true })
    });

    await expect(service.connect()).rejects.toThrow('MONGODB_URI is not configured.');
  });

  it('connects successfully and reports a healthy database state', async () => {
    const { mongooseMock } = createMongooseMock();
    const service = createDatabaseService({
      mongooseInstance: mongooseMock,
      runtimeEnv: createRuntimeEnv({ mongoUri: 'mongodb://127.0.0.1:27017/rapport' })
    });

    await service.connect();

    expect(mongooseMock.connect).toHaveBeenCalledWith('mongodb://127.0.0.1:27017/rapport', {
      serverSelectionTimeoutMS: 3000
    });
    expect(service.getHealth()).toEqual({
      configured: true,
      required: false,
      connected: true,
      readyState: 1,
      lastError: null
    });
  });

  it('captures connection errors without throwing when the DB is optional', async () => {
    const { mongooseMock, emit } = createMongooseMock();
    mongooseMock.connect.mockImplementationOnce(async () => {
      emit('error', new Error('connect failed'));
      throw new Error('connect failed');
    });

    const service = createDatabaseService({
      mongooseInstance: mongooseMock,
      runtimeEnv: createRuntimeEnv({ mongoUri: 'mongodb://127.0.0.1:27017/rapport' })
    });

    await service.connect();

    expect(service.getHealth()).toEqual({
      configured: true,
      required: false,
      connected: false,
      readyState: 0,
      lastError: 'connect failed'
    });
  });

  it('rethrows connection errors when the DB is required', async () => {
    const { mongooseMock } = createMongooseMock();
    mongooseMock.connect.mockRejectedValueOnce(new Error('required failure'));

    const service = createDatabaseService({
      mongooseInstance: mongooseMock,
      runtimeEnv: createRuntimeEnv({
        mongoUri: 'mongodb://127.0.0.1:27017/rapport',
        dbRequired: true
      })
    });

    await expect(service.connect()).rejects.toThrow('required failure');
  });

  it('falls back to a generic message for unknown emitted errors', () => {
    const { mongooseMock, emit } = createMongooseMock();
    const service = createDatabaseService({
      mongooseInstance: mongooseMock,
      runtimeEnv: createRuntimeEnv()
    });

    emit('error');

    expect(service.getHealth().lastError).toBe('Unknown MongoDB connection error');
  });

  it('falls back to a generic message for non-Error connection failures', async () => {
    const { mongooseMock } = createMongooseMock();
    mongooseMock.connect.mockRejectedValueOnce('string failure');

    const service = createDatabaseService({
      mongooseInstance: mongooseMock,
      runtimeEnv: createRuntimeEnv({ mongoUri: 'mongodb://127.0.0.1:27017/rapport' })
    });

    await service.connect();

    expect(service.getHealth().lastError).toBe('Unknown MongoDB connection error');
  });

  it('disconnects only when a connection is active and reacts to emitted events', async () => {
    const { mongooseMock, emit } = createMongooseMock();
    const service = createDatabaseService({
      mongooseInstance: mongooseMock,
      runtimeEnv: createRuntimeEnv({ mongoUri: 'mongodb://127.0.0.1:27017/rapport' })
    });

    await service.disconnect();
    expect(mongooseMock.disconnect).not.toHaveBeenCalled();

    mongooseMock.connection.readyState = 1;
    emit('connected');
    expect(service.getHealth().connected).toBe(true);

    emit('error', new Error('socket hiccup'));
    expect(service.getHealth().lastError).toBe('socket hiccup');

    mongooseMock.connection.readyState = 1;
    await service.disconnect();
    expect(mongooseMock.disconnect).toHaveBeenCalledOnce();
    expect(service.getHealth().connected).toBe(false);
  });

  it('covers the module-level wrappers and default event listeners', async () => {
    await connectToDatabase();

    mongoose.connection.emit('connected');
    mongoose.connection.emit('error', new Error('default listener error'));
    mongoose.connection.emit('disconnected');

    expect(getDatabaseHealth()).toEqual(
      expect.objectContaining({
        configured: expect.any(Boolean),
        required: expect.any(Boolean),
        connected: expect.any(Boolean),
        readyState: expect.any(Number),
        lastError: 'default listener error'
      })
    );

    await disconnectFromDatabase();
  });
});

