import dotenv from 'dotenv';

dotenv.config();

/**
 * Parses a string environment flag into a boolean while preserving a default
 * when the variable is unset.
 */
export function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

/**
 * Normalizes process environment values into the server's typed runtime config.
 */
export function createEnv(source: NodeJS.ProcessEnv = process.env) {
  return {
    nodeEnv: source.NODE_ENV ?? 'development',
    port: Number(source.PORT ?? 4000),
    corsOrigin: source.CORS_ORIGIN ?? 'http://localhost:5173',
    jwtSecret: source.JWT_SECRET ?? '',
    mongoUri: source.MONGODB_URI,
    dbRequired: parseBoolean(source.DB_REQUIRED, false)
  };
}

export type RuntimeEnv = ReturnType<typeof createEnv>;

/**
 * Shared runtime environment used by the server in production code.
 */
export const env = createEnv();

