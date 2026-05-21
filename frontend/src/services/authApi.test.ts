import { describe, expect, it, vi } from 'vitest';
import { AuthApiError, fetchCurrentUser, loginWithPassword, registerAccount } from './authApi';

function createResponse(payload: unknown, overrides: Partial<Response> = {}): Response {
  return {
    ok: true,
    status: 200,
    json: vi.fn(async () => payload),
    ...overrides
  } as unknown as Response;
}

describe('authApi', () => {
  it('logs in with the configured auth endpoint and returns a full session', async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('https://api.example.test/auth/login');
      expect(init).toMatchObject({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      expect(init?.body).toBe(JSON.stringify({ email: 'builder@example.com', password: 'super-secret' }));

      return createResponse({
        ok: true,
        token: 'jwt.token',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      });
    });

    await expect(
      loginWithPassword(
        { email: 'builder@example.com', password: 'super-secret' },
        {
          apiBaseUrl: 'https://api.example.test/',
          fetchFn
        }
      )
    ).resolves.toEqual({
      token: 'jwt.token',
      user: {
        id: 'user-1',
        username: 'builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    });
  });

  it('throws the API error message for unsuccessful register requests', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse(
        {
          ok: false,
          error: 'An account with that email already exists.'
        },
        {
          ok: false,
          status: 409
        }
      )
    );

    await expect(
      registerAccount(
        {
          username: 'builder',
          email: 'builder@example.com',
          password: 'super-secret'
        },
        {
          apiBaseUrl: 'https://api.example.test',
          fetchFn
        }
      )
    ).rejects.toEqual(new AuthApiError('An account with that email already exists.', 409));
  });

  it('registers successfully and returns a full authenticated session', async () => {
    const fetchFn = vi.fn(async () =>
      createResponse({
        ok: true,
        token: 'jwt.register',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      })
    );

    await expect(
      registerAccount(
        {
          username: 'builder',
          email: 'builder@example.com',
          password: 'super-secret'
        },
        {
          apiBaseUrl: '/api',
          fetchFn
        }
      )
    ).resolves.toMatchObject({ token: 'jwt.register' });
  });

  it('adds the bearer token when loading the current user', async () => {
    const fetchFn = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toEqual({
        Authorization: 'Bearer jwt.token'
      });

      return createResponse({
        ok: true,
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      });
    });

    await expect(fetchCurrentUser('jwt.token', { apiBaseUrl: '/api', fetchFn })).resolves.toMatchObject({
      username: 'builder'
    });
  });

  it('falls back to generic messages for malformed success payloads and non-JSON errors', async () => {
    const incompleteSuccessFetch = vi.fn(async () => createResponse({ ok: true }));
    const incompleteCurrentUserFetch = vi.fn(async () => createResponse({ ok: true }));
    const nonJsonErrorFetch = vi.fn(async () =>
      ({
        ok: false,
        status: 500,
        json: vi.fn(async () => {
          throw new Error('not json');
        })
      }) as unknown as Response
    );

    await expect(loginWithPassword({ email: 'builder@example.com', password: 'super-secret' }, { apiBaseUrl: '/api', fetchFn: incompleteSuccessFetch })).rejects.toEqual(
      new AuthApiError('Authentication response was incomplete.', 500)
    );
    await expect(fetchCurrentUser('jwt.token', { apiBaseUrl: '/api', fetchFn: incompleteCurrentUserFetch })).rejects.toEqual(
      new AuthApiError('Current user response was incomplete.', 500)
    );
    await expect(fetchCurrentUser('jwt.token', { apiBaseUrl: '/api', fetchFn: nonJsonErrorFetch })).rejects.toEqual(
      new AuthApiError('Authentication request failed.', 500)
    );
  });

  it('surfaces network failures with a consistent offline-style message', async () => {
    const fetchFn = vi.fn(async () => {
      throw new Error('network down');
    });

    await expect(loginWithPassword({ email: 'builder@example.com', password: 'super-secret' }, { apiBaseUrl: '/api', fetchFn })).rejects.toEqual(
      new AuthApiError('Unable to reach the authentication service.', 0)
    );
  });

  it('uses the default api base url and window.fetch when no request overrides are provided', async () => {
    const originalFetch = window.fetch;
    const fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      expect(input).toBe('/api/auth/login');
      expect(init).toMatchObject({
        method: 'POST'
      });

      return createResponse({
        ok: true,
        token: 'jwt.default',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      });
    });

    window.fetch = fetchSpy as typeof window.fetch;

    try {
      await expect(loginWithPassword({ email: 'builder@example.com', password: 'super-secret' })).resolves.toMatchObject({
        token: 'jwt.default'
      });
    } finally {
      window.fetch = originalFetch;
    }
  });
});

