import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY, clearStoredToken, readStoredToken, writeStoredToken } from './authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('reads and writes the auth token using localStorage by default', () => {
    writeStoredToken('demo-token');

    expect(readStoredToken()).toBe('demo-token');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('demo-token');
  });

  it('clears the auth token using localStorage by default', () => {
    window.localStorage.setItem(STORAGE_KEY, 'stale-token');

    clearStoredToken();

    expect(readStoredToken()).toBeNull();
  });

  it('supports explicit storage overrides', () => {
    const fakeStorage = {
      getItem: vi.fn().mockReturnValue('override-token'),
      setItem: vi.fn(),
      removeItem: vi.fn()
    };

    writeStoredToken('custom-token', fakeStorage);
    clearStoredToken(fakeStorage);

    expect(readStoredToken(fakeStorage)).toBe('override-token');
    expect(fakeStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY, 'custom-token');
    expect(fakeStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
  });
});

