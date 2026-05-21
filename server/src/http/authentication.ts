import type express from 'express';
import { extractBearerToken, type AuthService, type AuthUser } from '../services/auth.js';
import { sendServiceError } from './service-errors.js';

export type AuthenticatedLocals = {
  authUser?: AuthUser;
};

/**
 * Builds Express middleware that resolves the current user from a bearer token and
 * attaches it to response locals for downstream handlers.
 */
export function createRequireAuthenticatedUser(authService: AuthService): express.RequestHandler {
  return async (request, response, next) => {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      response.status(401).json({
        ok: false,
        error: 'Authentication token is required.'
      });

      return;
    }

    try {
      (response.locals as AuthenticatedLocals).authUser = await authService.getCurrentUser(token);
      next();
    } catch (error) {
      sendServiceError(error, response, 'An unexpected authentication error occurred.');
    }
  };
}

/**
 * Reads the authenticated user that the auth middleware attached to response
 * locals so controllers do not need to re-parse or re-verify the token.
 */
export function getAuthenticatedUser(response: express.Response) {
  const user = (response.locals as AuthenticatedLocals).authUser;

  if (!user) {
    throw new Error('Authenticated user was not attached to the request context.');
  }

  return user;
}

