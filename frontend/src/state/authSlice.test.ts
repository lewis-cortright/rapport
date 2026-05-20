import { describe, expect, it } from 'vitest';
import { authReducer, clearCredentials, selectIsAuthenticated, selectToken, setCredentials } from './authSlice';

describe('authSlice', () => {
  it('stores credentials when login succeeds', () => {
    const nextState = authReducer({ token: null }, setCredentials('demo-token'));

    expect(nextState.token).toBe('demo-token');
  });

  it('clears credentials when logout occurs', () => {
    const nextState = authReducer({ token: 'demo-token' }, clearCredentials());

    expect(nextState.token).toBeNull();
  });

  it('selects auth data from the root state', () => {
    const authenticatedState = { auth: { token: 'demo-token' } };
    const anonymousState = { auth: { token: null } };

    expect(selectToken(authenticatedState)).toBe('demo-token');
    expect(selectIsAuthenticated(authenticatedState)).toBe(true);
    expect(selectIsAuthenticated(anonymousState)).toBe(false);
  });
});

