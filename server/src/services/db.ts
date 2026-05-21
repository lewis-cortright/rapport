import mongoose from 'mongoose';
import { env, type RuntimeEnv } from '../config/env.js';

export type DatabaseHealth = {
  configured: boolean;
  required: boolean;
  connected: boolean;
  readyState: number;
  lastError: string | null;
};

type ConnectionEvent = 'connected' | 'disconnected' | 'error';

type MongooseLike = {
  connection: {
    readyState: number;
    on: (event: ConnectionEvent, handler: (error?: Error) => void) => void;
  };
  connect: (uri: string, options: { serverSelectionTimeoutMS: number }) => Promise<unknown>;
  disconnect: () => Promise<unknown>;
};

/**
 * Creates the database lifecycle wrapper used by the server and tests.
 *
 * The service tracks a lightweight health snapshot so `/api/health` can report
 * whether MongoDB is configured, required, and currently connected.
 */
export function createDatabaseService(options: { mongooseInstance?: MongooseLike; runtimeEnv?: RuntimeEnv } = {}) {
  const mongooseInstance = options.mongooseInstance ?? mongoose;
  const runtimeEnv = options.runtimeEnv ?? env;

  const state: DatabaseHealth = {
    configured: Boolean(runtimeEnv.mongoUri),
    required: runtimeEnv.dbRequired,
    connected: false,
    readyState: mongooseInstance.connection.readyState,
    lastError: null
  };

  mongooseInstance.connection.on('connected', () => {
    state.connected = true;
    state.readyState = mongooseInstance.connection.readyState;
    state.lastError = null;
  });

  mongooseInstance.connection.on('disconnected', () => {
    state.connected = false;
    state.readyState = mongooseInstance.connection.readyState;
  });

  mongooseInstance.connection.on('error', (error) => {
    state.connected = false;
    state.readyState = mongooseInstance.connection.readyState;
    state.lastError = error?.message ?? 'Unknown MongoDB connection error';
  });

  return {
    async connect() {
      state.configured = Boolean(runtimeEnv.mongoUri);
      state.required = runtimeEnv.dbRequired;

      if (!runtimeEnv.mongoUri) {
        state.lastError = 'MONGODB_URI is not configured.';

        if (runtimeEnv.dbRequired) {
          throw new Error(state.lastError);
        }

        return;
      }

      try {
        await mongooseInstance.connect(runtimeEnv.mongoUri, {
          serverSelectionTimeoutMS: 3000
        });
      } catch (error) {
        state.connected = false;
        state.readyState = mongooseInstance.connection.readyState;
        state.lastError = error instanceof Error ? error.message : 'Unknown MongoDB connection error';

        if (runtimeEnv.dbRequired) {
          throw error;
        }
      }
    },

    async disconnect() {
      if (mongooseInstance.connection.readyState !== 0) {
        await mongooseInstance.disconnect();
      }
    },

    getHealth(): DatabaseHealth {
      return {
        ...state,
        readyState: mongooseInstance.connection.readyState,
        connected: mongooseInstance.connection.readyState === 1
      };
    }
  };
}

const databaseService = createDatabaseService();

/**
 * Connects the shared application database service.
 */
export function connectToDatabase() {
  return databaseService.connect();
}

/**
 * Disconnects the shared application database service when a connection exists.
 */
export function disconnectFromDatabase() {
  return databaseService.disconnect();
}

/**
 * Returns the latest shared database health snapshot for readiness reporting.
 */
export function getDatabaseHealth() {
  return databaseService.getHealth();
}

