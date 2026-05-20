import { describe, expect, it } from 'vitest';
import { authReducer, clearCredentials, selectIsAuthenticated, selectToken, setCredentials } from './authSlice';

describe('authSlice', () => {
  it('stores credentials when login succeeds', () => {
    const nextState = authReducer({ token: null }, setCredentials('access-token'));

    expect(nextState.token).toBe('access-token');
  });

  it('clears credentials when logout occurs', () => {
    const nextState = authReducer({ token: 'access-token' }, clearCredentials());

    expect(nextState.token).toBeNull();
  });

  it('selects auth data from the root state', () => {
    const authenticatedState = { auth: { token: 'access-token' } };
    const anonymousState = { auth: { token: null } };

    expect(selectToken(authenticatedState)).toBe('access-token');
    expect(selectIsAuthenticated(authenticatedState)).toBe(true);
    expect(selectIsAuthenticated(anonymousState)).toBe(false);
  });
});

