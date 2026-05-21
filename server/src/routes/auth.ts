import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { createAuthController } from '../controllers/auth.js';
import type { AuthService } from '../services/auth.js';

type CreateAuthRouterOptions = {
  authService: AuthService;
  requireAuthenticatedUser: RequestHandler;
  /** Override the rate-limiter window in milliseconds (useful in tests to keep
   *  the window small enough that rate-limit tests finish quickly). */
  authRateLimitWindowMs?: number;
  /** Override the maximum allowed requests per window (pass Infinity to disable
   *  the limit in test environments). */
  authRateLimitMax?: number;
};

/**
 * Brute-force protection for credential endpoints.  Clients that exceed the
 * threshold inside the window receive a 429 with a JSON error body that is
 * consistent with the rest of the API surface.
 */
function createAuthRateLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { ok: false, error: 'Too many requests. Please try again later.' }
  });
}

/**
 * Registers the auth endpoints and applies auth middleware only where a route
 * needs an already-resolved current user.  Register and login are rate-limited
 * to reduce the risk of credential stuffing and brute-force attacks.
 */
export function createAuthRouter(options: CreateAuthRouterOptions) {
  const controller = createAuthController(options.authService);
  const router = Router();

  // 20 credential attempts per 15-minute window per IP address.
  const authLimiter = createAuthRateLimiter(
    options.authRateLimitWindowMs ?? 15 * 60 * 1000,
    options.authRateLimitMax ?? 20
  );

  router.post('/register', authLimiter, controller.register);
  router.post('/login', authLimiter, controller.login);
  router.get('/me', options.requireAuthenticatedUser, controller.getCurrentUser);

  return router;
}
