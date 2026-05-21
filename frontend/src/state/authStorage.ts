export const STORAGE_KEY = 'rapport.auth.token';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function resolveStorage(storage?: StorageLike) {
  return storage ?? window.localStorage;
}

/**
 * Reads the persisted auth token from storage.
 */
export function readStoredToken(storage?: StorageLike) {
  return resolveStorage(storage).getItem(STORAGE_KEY);
}

/**
 * Persists the current auth token for session restoration.
 */
export function writeStoredToken(token: string, storage?: StorageLike) {
  resolveStorage(storage).setItem(STORAGE_KEY, token);
}

/**
 * Removes the persisted auth token when the session ends or becomes invalid.
 */
export function clearStoredToken(storage?: StorageLike) {
  resolveStorage(storage).removeItem(STORAGE_KEY);
}

