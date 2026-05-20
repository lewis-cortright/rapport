export const STORAGE_KEY = 'rapport.auth.token';

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function resolveStorage(storage?: StorageLike) {
  return storage ?? window.localStorage;
}

export function readStoredToken(storage?: StorageLike) {
  return resolveStorage(storage).getItem(STORAGE_KEY);
}

export function writeStoredToken(token: string, storage?: StorageLike) {
  resolveStorage(storage).setItem(STORAGE_KEY, token);
}

export function clearStoredToken(storage?: StorageLike) {
  resolveStorage(storage).removeItem(STORAGE_KEY);
}

