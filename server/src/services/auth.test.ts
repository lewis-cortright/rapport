import jwt from 'jsonwebtoken';
import { describe, expect, it, vi } from 'vitest';
import { AuthServiceError, createAuthService, createMongooseUserStore, extractBearerToken, type StoredUser, type UserStore } from './auth';
import { env, type RuntimeEnv } from '../config/env';

const JsonWebTokenError = jwt.JsonWebTokenError;
const TokenExpiredError = jwt.TokenExpiredError;

function createRuntimeEnv(overrides: Partial<RuntimeEnv> = {}): RuntimeEnv {
  return {
    nodeEnv: 'test',
    port: 4000,
    corsOrigin: 'http://localhost:5173',
    jwtSecret: 'test-secret',
    mongoUri: undefined,
    dbRequired: false,
    ...overrides
  };
}

function createUserStore(initialUsers: StoredUser[] = []): { users: StoredUser[]; store: UserStore } {
  const users = [...initialUsers];

  return {
    users,
    store: {
      async findByEmail(email: string) {
        return users.find((user) => user.email === email) ?? null;
      },
      async findById(id: string) {
        return users.find((user) => user.id === id) ?? null;
      },
      async createUser(input) {
        const timestamp = '2026-05-20T00:00:00.000Z';
        const createdUser: StoredUser = {
          id: `user-${users.length + 1}`,
          username: input.username,
          email: input.email,
          passwordHash: input.passwordHash,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        users.push(createdUser);

        return createdUser;
      }
    }
  };
}

describe('extractBearerToken', () => {
  it('returns the token for well-formed bearer values and handles array headers', () => {
    expect(extractBearerToken('Bearer token-123')).toBe('token-123');
    expect(extractBearerToken(['Bearer token-456'])).toBe('token-456');
  });

  it('returns null when the header is missing or malformed', () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken('Token token-123')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
  });
});

describe('createMongooseUserStore', () => {
  it('maps model documents into stored users and returns null for misses', async () => {
    const fakeModel = {
      findOne: vi.fn(async ({ email }: { email: string }) =>
        email === 'builder@example.com'
          ? {
              _id: { toString: () => 'user-1' },
              username: 'builder',
              email,
              passwordHash: 'hash-1',
              createdAt: new Date('2026-05-20T00:00:00.000Z'),
              updatedAt: new Date('2026-05-20T00:00:00.000Z')
            }
          : null
      ),
      findById: vi.fn(async (id: string) => ({
        _id: id,
        username: 'builder',
        email: 'builder@example.com',
        passwordHash: 'hash-1',
        createdAt: new Date('2026-05-20T00:00:00.000Z'),
        updatedAt: new Date('2026-05-20T00:00:00.000Z')
      })),
      create: vi.fn(async (input) => ({
        _id: 'user-2',
        ...input,
        createdAt: new Date('2026-05-20T01:00:00.000Z'),
        updatedAt: new Date('2026-05-20T01:00:00.000Z')
      }))
    };

    const store = createMongooseUserStore(fakeModel);

    await expect(store.findByEmail('builder@example.com')).resolves.toEqual({
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      passwordHash: 'hash-1',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    });
    await expect(store.findByEmail('missing@example.com')).resolves.toBeNull();
    await expect(store.findById('user-1')).resolves.toMatchObject({ id: 'user-1' });
    fakeModel.findById.mockResolvedValueOnce(null as any);
    await expect(store.findById('missing-user')).resolves.toBeNull();
    await expect(
      store.createUser({
        username: 'new-user',
        email: 'new@example.com',
        passwordHash: 'hash-2'
      })
    ).resolves.toEqual({
      id: 'user-2',
      username: 'new-user',
      email: 'new@example.com',
      passwordHash: 'hash-2',
      createdAt: '2026-05-20T01:00:00.000Z',
      updatedAt: '2026-05-20T01:00:00.000Z'
    });
  });
});

describe('createAuthService', () => {
  it('registers, logs in, and restores the current user with the default bcrypt and JWT helpers', async () => {
    const { users, store } = createUserStore();
    const service = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: store
    });

    const registered = await service.register({
      username: '  Rapport Builder  ',
      email: 'BUILDER@example.com ',
      password: 'super-secret'
    });

    expect(registered.user).toMatchObject({
      id: 'user-1',
      username: 'Rapport Builder',
      email: 'builder@example.com'
    });
    expect(users[0]?.passwordHash).not.toBe('super-secret');
    expect(registered.token).toEqual(expect.any(String));

    const loggedIn = await service.login({
      email: 'builder@example.com',
      password: 'super-secret'
    });

    expect(loggedIn.user.username).toBe('Rapport Builder');

    await expect(service.getCurrentUser(registered.token)).resolves.toEqual(registered.user);
  });

  it('throws a configuration error when JWT auth has not been configured', async () => {
    const { store } = createUserStore();
    const service = createAuthService({
      runtimeEnv: createRuntimeEnv({ jwtSecret: '' }),
      userStore: store
    });

    await expect(
      service.register({
        username: 'builder',
        email: 'builder@example.com',
        password: 'super-secret'
      })
    ).rejects.toMatchObject({
      message: 'JWT authentication is not configured on the server.',
      statusCode: 500
    });
  });

  it('validates registration input', async () => {
    const { store } = createUserStore();
    const service = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: store,
      hashPassword: vi.fn(async () => 'hash')
    });

    await expect(service.register({ username: 'ab', email: 'builder@example.com', password: 'super-secret' })).rejects.toBeInstanceOf(AuthServiceError);
    await expect(service.register({ username: 'builder', email: 'invalid-email', password: 'super-secret' })).rejects.toMatchObject({ message: 'A valid email address is required.' });
    await expect(service.register({ username: 'builder', email: 'builder@example.com', password: 'short' })).rejects.toMatchObject({ message: 'Password must be at least 8 characters long.' });
    await expect(service.register(null)).rejects.toMatchObject({ message: 'Username must be at least 3 characters long.' });
  });

  it('rejects duplicate emails both before and during persistence', async () => {
    const existingUser: StoredUser = {
      id: 'user-1',
      username: 'builder',
      email: 'builder@example.com',
      passwordHash: 'hash-1',
      createdAt: '2026-05-20T00:00:00.000Z',
      updatedAt: '2026-05-20T00:00:00.000Z'
    };

    const serviceWithExistingUser = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: createUserStore([existingUser]).store,
      hashPassword: vi.fn(async () => 'hash')
    });

    await expect(
      serviceWithExistingUser.register({
        username: 'builder',
        email: 'builder@example.com',
        password: 'super-secret'
      })
    ).rejects.toMatchObject({
      message: 'An account with that email already exists.',
      statusCode: 409
    });

    const duplicateOnCreateService = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: {
        async findByEmail() {
          return null;
        },
        async findById() {
          return null;
        },
        async createUser() {
          throw { code: 11000 };
        }
      },
      hashPassword: vi.fn(async () => 'hash')
    });

    await expect(
      duplicateOnCreateService.register({
        username: 'builder',
        email: 'builder@example.com',
        password: 'super-secret'
      })
    ).rejects.toMatchObject({
      message: 'An account with that email already exists.',
      statusCode: 409
    });
  });

  it('rethrows unexpected persistence failures during registration', async () => {
    const service = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: {
        async findByEmail() {
          return null;
        },
        async findById() {
          return null;
        },
        async createUser() {
          throw new Error('database unavailable');
        }
      },
      hashPassword: vi.fn(async () => 'hash')
    });

    await expect(
      service.register({
        username: 'builder',
        email: 'builder@example.com',
        password: 'super-secret'
      })
    ).rejects.toThrow('database unavailable');
  });

  it('validates login input and rejects invalid credentials', async () => {
    const comparePassword = vi.fn(async () => false);
    const service = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: {
        async findByEmail(email: string) {
          if (email === 'builder@example.com') {
            return {
              id: 'user-1',
              username: 'builder',
              email,
              passwordHash: 'hash-1',
              createdAt: '2026-05-20T00:00:00.000Z',
              updatedAt: '2026-05-20T00:00:00.000Z'
            };
          }

          return null;
        },
        async findById() {
          return null;
        },
        async createUser() {
          throw new Error('not used');
        }
      },
      comparePassword
    });

    await expect(service.login({ email: 'invalid-email', password: 'whatever' })).rejects.toMatchObject({ message: 'A valid email address is required.' });
    await expect(service.login({ email: 'builder@example.com', password: '' })).rejects.toMatchObject({ message: 'Password is required.' });
    await expect(service.login(null)).rejects.toMatchObject({ message: 'A valid email address is required.' });
    await expect(service.login({ email: 'missing@example.com', password: 'super-secret' })).rejects.toMatchObject({ message: 'Invalid email or password.', statusCode: 401 });
    await expect(service.login({ email: 'builder@example.com', password: 'super-secret' })).rejects.toMatchObject({ message: 'Invalid email or password.', statusCode: 401 });
    expect(comparePassword).toHaveBeenCalledWith('super-secret', 'hash-1');
  });

  it('uses the default runtime environment when no env override is supplied', async () => {
    const service = createAuthService({
      userStore: createUserStore().store
    });

    const attempt = service.register({
      username: 'builder',
      email: 'builder@example.com',
      password: 'super-secret'
    });

    if (!env.jwtSecret) {
      await expect(attempt).rejects.toMatchObject({
        message: 'JWT authentication is not configured on the server.',
        statusCode: 500
      });

      return;
    }

    await expect(attempt).resolves.toMatchObject({
      user: {
        username: 'builder',
        email: 'builder@example.com'
      },
      token: expect.any(String)
    });
  });

  it('rejects invalid or expired tokens and missing users when restoring the current user', async () => {
    const { store } = createUserStore();
    const expiredTokenService = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: store,
      verifyToken: vi.fn(() => {
        throw new TokenExpiredError('expired', new Date('2026-05-20T00:00:00.000Z'));
      })
    });
    const invalidTokenService = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: store,
      verifyToken: vi.fn(() => {
        throw new JsonWebTokenError('invalid');
      })
    });
    const missingSubService = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: store,
      verifyToken: vi.fn(() => ({}))
    });
    const missingUserService = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: store,
      verifyToken: vi.fn(() => ({ sub: 'missing-user' }))
    });

    await expect(expiredTokenService.getCurrentUser('expired-token')).rejects.toMatchObject({ message: 'Authentication token has expired.', statusCode: 401 });
    await expect(invalidTokenService.getCurrentUser('invalid-token')).rejects.toMatchObject({ message: 'Authentication token is invalid.', statusCode: 401 });
    await expect(missingSubService.getCurrentUser('missing-sub')).rejects.toMatchObject({ message: 'Authentication token is invalid.', statusCode: 401 });
    await expect(missingUserService.getCurrentUser('missing-user')).rejects.toMatchObject({ message: 'Authenticated user could not be found.', statusCode: 401 });
  });

  it('rethrows unexpected token verification failures', async () => {
    const { store } = createUserStore();
    const service = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: store,
      verifyToken: vi.fn(() => {
        throw new Error('verification service offline');
      })
    });

    await expect(service.getCurrentUser('token')).rejects.toThrow('verification service offline');
  });

  it('treats string JWT payloads as invalid current-user tokens', async () => {
    const { store } = createUserStore();
    const token = jwt.sign('plain-string-payload', createRuntimeEnv().jwtSecret);
    const service = createAuthService({
      runtimeEnv: createRuntimeEnv(),
      userStore: store
    });

    await expect(service.getCurrentUser(token)).rejects.toMatchObject({
      message: 'Authentication token is invalid.',
      statusCode: 401
    });
  });
});

