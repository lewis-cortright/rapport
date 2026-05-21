import { describe, expect, it } from 'vitest';
import { authReducer, clearAuthError, clearCredentials, selectAuthError, selectAuthStatus, selectIsAuthenticated, selectToken, selectUser, setAuthError, setAuthPending, setCredentials, setCurrentUser } from './authSlice';

describe('authSlice', () => {
  it('stores credentials when login succeeds', () => {
    const nextState = authReducer(
      { token: null, user: null, status: 'idle', error: null },
      setCredentials({
        token: 'jwt.token',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      })
    );

    expect(nextState).toEqual({
      token: 'jwt.token',
      user: {
        id: 'user-1',
        username: 'builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      },
      status: 'idle',
      error: null
    });
  });

  it('tracks loading, errors, user hydration, and logout state', () => {
    const pendingState = authReducer({ token: 'jwt.token', user: null, status: 'idle', error: 'old error' }, setAuthPending());
    const errorState = authReducer(pendingState, setAuthError('Unable to sign in.'));
    const hydratedState = authReducer(
      errorState,
      setCurrentUser({
        id: 'user-1',
        username: 'builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      })
    );
    const clearedErrorState = authReducer({ ...hydratedState, error: 'stale error' }, clearAuthError());
    const nextState = authReducer(clearedErrorState, clearCredentials());

    expect(pendingState.status).toBe('loading');
    expect(errorState.error).toBe('Unable to sign in.');
    expect(hydratedState.user?.username).toBe('builder');
    expect(clearedErrorState.error).toBeNull();
    expect(nextState).toEqual({
      token: null,
      user: null,
      status: 'idle',
      error: null
    });
  });

  it('selects auth data from the root state', () => {
    const authenticatedState = {
      auth: {
        token: 'jwt.token',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        },
        status: 'idle' as const,
        error: null
      }
    };
    const anonymousState = { auth: { token: null, user: null, status: 'loading' as const, error: 'Missing token' } };

    expect(selectToken(authenticatedState)).toBe('jwt.token');
    expect(selectUser(authenticatedState)?.username).toBe('builder');
    expect(selectAuthStatus(anonymousState)).toBe('loading');
    expect(selectAuthError(anonymousState)).toBe('Missing token');
    expect(selectIsAuthenticated(authenticatedState)).toBe(true);
    expect(selectIsAuthenticated(anonymousState)).toBe(false);
  });
});

