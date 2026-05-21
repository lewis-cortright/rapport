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
    expect(store.getState().auth.user).toBeNull();
  });

  it('allows explicit preloaded state to override storage', () => {
    window.localStorage.setItem(STORAGE_KEY, 'stored-token');

    const store = createAppStore({
      auth: {
        token: 'preloaded-token',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      }
    });

    expect(store.getState().auth.token).toBe('preloaded-token');
    expect(store.getState().auth.user?.username).toBe('builder');
  });

  it('persists login and logout actions to localStorage', () => {
    const store = createAppStore();

    store.dispatch(
      setCredentials({
        token: 'fresh-token',
        user: {
          id: 'user-1',
          username: 'builder',
          email: 'builder@example.com',
          createdAt: '2026-05-20T00:00:00.000Z',
          updatedAt: '2026-05-20T00:00:00.000Z'
        }
      })
    );
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('fresh-token');

    store.dispatch(clearCredentials());
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

