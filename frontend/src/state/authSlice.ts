import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthSession, AuthUser } from '../services/authApi';

/**
 * Minimal auth state stored in Redux for the current session.
 */
export type AuthState = {
  token: string | null;
  user: AuthUser | null;
  status: 'idle' | 'loading';
  error: string | null;
};

/**
 * Root-state shape needed by the auth selectors.
 */
export type AuthRootState = {
  auth: AuthState;
};

const initialState: AuthState = {
  token: null,
  user: null,
  status: 'idle',
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthSession>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.status = 'idle';
      state.error = null;
    },
    setCurrentUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = 'idle';
      state.error = null;
    },
    setAuthPending(state) {
      state.status = 'loading';
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.status = 'idle';
      state.error = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
    clearCredentials(state) {
      state.token = null;
      state.user = null;
      state.status = 'idle';
      state.error = null;
    }
  }
});

export const { clearAuthError, clearCredentials, setAuthError, setAuthPending, setCredentials, setCurrentUser } = authSlice.actions;

/**
 * Reducer backing the shared auth slice.
 */
export const authReducer = authSlice.reducer;

/**
 * Selects the current bearer token.
 */
export function selectToken(state: AuthRootState) {
  return state.auth.token;
}

/**
 * Selects the authenticated user payload.
 */
export function selectUser(state: AuthRootState) {
  return state.auth.user;
}

/**
 * Selects whether an auth request is currently in flight.
 */
export function selectAuthStatus(state: AuthRootState) {
  return state.auth.status;
}

/**
 * Selects the latest user-facing auth error message.
 */
export function selectAuthError(state: AuthRootState) {
  return state.auth.error;
}

/**
 * Selects whether a token-backed session currently exists.
 */
export function selectIsAuthenticated(state: AuthRootState) {
  return Boolean(state.auth.token);
}

