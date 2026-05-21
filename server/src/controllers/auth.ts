import type express from 'express';
import { getAuthenticatedUser } from '../http/authentication.js';
import { sendServiceError } from '../http/service-errors.js';
import type { AuthService } from '../services/auth.js';

/**
 * Adapts auth-service use cases to HTTP request/response handlers without
 * letting routing concerns leak into the service layer.
 */
export function createAuthController(authService: AuthService) {
  return {
    register: async (request: express.Request, response: express.Response) => {
      try {
        const result = await authService.register(request.body);

        response.status(201).json({
          ok: true,
          ...result
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected authentication error occurred.');
      }
    },

    login: async (request: express.Request, response: express.Response) => {
      try {
        const result = await authService.login(request.body);

        response.json({
          ok: true,
          ...result
        });
      } catch (error) {
        sendServiceError(error, response, 'An unexpected authentication error occurred.');
      }
    },

    getCurrentUser: async (_request: express.Request, response: express.Response) => {
      response.json({
        ok: true,
        user: getAuthenticatedUser(response)
      });
    }
  };
}

