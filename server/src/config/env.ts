import dotenv from 'dotenv';

dotenv.config();

export function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
}

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

export const env = createEnv();

