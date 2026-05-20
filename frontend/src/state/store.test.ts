import { beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY } from './authStorage';
import { clearCredentials, setCredentials } from './authSlice';
import { createAppStore } from './store';

describe('createAppStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('hydrates the auth token from localStorage when no preloaded state is provided', () => {
    window.localStorage.setItem(STORAGE_KEY, 'stored-token');

    const store = createAppStore();

    expect(store.getState().auth.token).toBe('stored-token');
  });

  it('allows explicit preloaded state to override storage', () => {
    window.localStorage.setItem(STORAGE_KEY, 'stored-token');

    const store = createAppStore({ auth: { token: 'preloaded-token' } });

    expect(store.getState().auth.token).toBe('preloaded-token');
  });

  it('persists login and logout actions to localStorage', () => {
    const store = createAppStore();

    store.dispatch(setCredentials('fresh-token'));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('fresh-token');

    store.dispatch(clearCredentials());
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

