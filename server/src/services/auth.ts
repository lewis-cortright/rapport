import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env, type RuntimeEnv } from '../config/env.js';

const JsonWebTokenError = jwt.JsonWebTokenError;
const TokenExpiredError = jwt.TokenExpiredError;

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type StoredUser = AuthUser & {
  passwordHash: string;
};

type UserCreateInput = {
  username: string;
  email: string;
  passwordHash: string;
};

export type UserStore = {
  findByEmail: (email: string) => Promise<StoredUser | null>;
  findById: (id: string) => Promise<StoredUser | null>;
  createUser: (input: UserCreateInput) => Promise<StoredUser>;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

export type AuthService = {
  register: (input: unknown) => Promise<AuthResult>;
  login: (input: unknown) => Promise<AuthResult>;
  getCurrentUser: (token: string) => Promise<AuthUser>;
};

type RegisterInput = {
  username: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type JwtPayloadLike = JwtPayload & {
  sub?: string;
};

type HashPassword = (password: string) => Promise<string>;
type ComparePassword = (password: string, passwordHash: string) => Promise<boolean>;
type SignToken = (user: StoredUser, secret: string) => string;
type VerifyToken = (token: string, secret: string) => JwtPayloadLike;

type UserDocumentLike = {
  _id: string | { toString: () => string };
  username: string;
  email: string;
  passwordHash: string;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type UserModelLike = {
  findOne: (filter: { email: string }) => PromiseLike<UserDocumentLike | null>;
  findById: (id: string) => PromiseLike<UserDocumentLike | null>;
  create: (input: UserCreateInput) => PromiseLike<UserDocumentLike>;
};

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 32
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

const UserModel = (mongoose.models.User as mongoose.Model<UserDocumentLike> | undefined) ?? mongoose.model<UserDocumentLike>('User', userSchema);

/**
 * Normalized application error used for auth-related HTTP responses.
 */
export class AuthServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'AuthServiceError';
    this.statusCode = statusCode;
  }
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function assertJwtSecret(secret: string) {
  if (!secret) {
    throw new AuthServiceError('JWT authentication is not configured on the server.', 500);
  }
}

function parseRegisterInput(input: unknown): RegisterInput {
  const candidate = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const username = typeof candidate.username === 'string' ? candidate.username.trim() : '';
  const email = typeof candidate.email === 'string' ? normalizeEmail(candidate.email) : '';
  const password = typeof candidate.password === 'string' ? candidate.password : '';

  if (username.length < 3) {
    throw new AuthServiceError('Username must be at least 3 characters long.', 400);
  }

  if (!isEmail(email)) {
    throw new AuthServiceError('A valid email address is required.', 400);
  }

  if (password.length < 8) {
    throw new AuthServiceError('Password must be at least 8 characters long.', 400);
  }

  return {
    username,
    email,
    password
  };
}

function parseLoginInput(input: unknown): LoginInput {
  const candidate = typeof input === 'object' && input !== null ? input as Record<string, unknown> : {};
  const email = typeof candidate.email === 'string' ? normalizeEmail(candidate.email) : '';
  const password = typeof candidate.password === 'string' ? candidate.password : '';

  if (!isEmail(email)) {
    throw new AuthServiceError('A valid email address is required.', 400);
  }

  if (!password) {
    throw new AuthServiceError('Password is required.', 400);
  }

  return {
    email,
    password
  };
}

function toStoredUser(document: UserDocumentLike): StoredUser {
  return {
    id: typeof document._id === 'string' ? document._id : document._id.toString(),
    username: document.username,
    email: document.email,
    passwordHash: document.passwordHash,
    createdAt: new Date(document.createdAt).toISOString(),
    updatedAt: new Date(document.updatedAt).toISOString()
  };
}

function isDuplicateKeyError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

function defaultSignToken(user: StoredUser, secret: string) {
  return jwt.sign({ sub: user.id, email: user.email }, secret, { expiresIn: '7d' });
}

function defaultVerifyToken(token: string, secret: string): JwtPayloadLike {
  const payload = jwt.verify(token, secret);

  if (typeof payload === 'string') {
    throw new AuthServiceError('Authentication token is invalid.', 401);
  }

  return payload as JwtPayloadLike;
}

/**
 * Extracts a bearer token from an Authorization header value.
 */
export function extractBearerToken(headerValue: string | string[] | undefined) {
  const value = Array.isArray(headerValue) ? headerValue[0] : headerValue;

  if (!value) {
    return null;
  }

  const [scheme, token] = value.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}

/**
 * Adapts a Mongoose user model to the persistence contract expected by the auth
 * service so tests can swap in lighter-weight doubles.
 */
export function createMongooseUserStore(userModel: UserModelLike = UserModel): UserStore {
  return {
    async findByEmail(email: string) {
      const user = await userModel.findOne({ email });

      return user ? toStoredUser(user) : null;
    },

    async findById(id: string) {
      const user = await userModel.findById(id);

      return user ? toStoredUser(user) : null;
    },

    async createUser(input: UserCreateInput) {
      const user = await userModel.create(input);

      return toStoredUser(user);
    }
  };
}

/**
 * Builds the server auth service used by the register, login, and current-user
 * endpoints.
 *
 * Optional dependencies make the service easy to unit test while the default
 * production path uses bcrypt, JWTs, and the shared Mongoose user model.
 */
export function createAuthService(options: {
  runtimeEnv?: RuntimeEnv;
  userStore?: UserStore;
  hashPassword?: HashPassword;
  comparePassword?: ComparePassword;
  signToken?: SignToken;
  verifyToken?: VerifyToken;
} = {}): AuthService {
  const runtimeEnv = options.runtimeEnv ?? env;
  const userStore = options.userStore ?? createMongooseUserStore();
  const hashPassword = options.hashPassword ?? ((password: string) => bcrypt.hash(password, 10));
  const comparePassword = options.comparePassword ?? ((password: string, passwordHash: string) => bcrypt.compare(password, passwordHash));
  const signToken = options.signToken ?? defaultSignToken;
  const verifyToken = options.verifyToken ?? defaultVerifyToken;

  return {
    async register(input: unknown) {
      assertJwtSecret(runtimeEnv.jwtSecret);
      const parsed = parseRegisterInput(input);
      const existingUser = await userStore.findByEmail(parsed.email);

      if (existingUser) {
        throw new AuthServiceError('An account with that email already exists.', 409);
      }

      try {
        const passwordHash = await hashPassword(parsed.password);
        const user = await userStore.createUser({
          username: parsed.username,
          email: parsed.email,
          passwordHash
        });

        return {
          token: signToken(user, runtimeEnv.jwtSecret),
          user: toAuthUser(user)
        };
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw new AuthServiceError('An account with that email already exists.', 409);
        }

        throw error;
      }
    },

    async login(input: unknown) {
      assertJwtSecret(runtimeEnv.jwtSecret);
      const parsed = parseLoginInput(input);
      const user = await userStore.findByEmail(parsed.email);

      if (!user) {
        throw new AuthServiceError('Invalid email or password.', 401);
      }

      const matches = await comparePassword(parsed.password, user.passwordHash);

      if (!matches) {
        throw new AuthServiceError('Invalid email or password.', 401);
      }

      return {
        token: signToken(user, runtimeEnv.jwtSecret),
        user: toAuthUser(user)
      };
    },

    async getCurrentUser(token: string) {
      assertJwtSecret(runtimeEnv.jwtSecret);

      let payload: JwtPayloadLike;

      try {
        payload = verifyToken(token, runtimeEnv.jwtSecret);
      } catch (error) {
        if (error instanceof AuthServiceError) {
          throw error;
        }

        if (error instanceof TokenExpiredError) {
          throw new AuthServiceError('Authentication token has expired.', 401);
        }

        if (error instanceof JsonWebTokenError) {
          throw new AuthServiceError('Authentication token is invalid.', 401);
        }

        throw error;
      }

      if (!payload.sub) {
        throw new AuthServiceError('Authentication token is invalid.', 401);
      }

      const user = await userStore.findById(payload.sub);

      if (!user) {
        throw new AuthServiceError('Authenticated user could not be found.', 401);
      }

      return toAuthUser(user);
    }
  };
}

