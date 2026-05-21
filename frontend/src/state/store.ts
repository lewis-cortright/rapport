import { configureStore, createListenerMiddleware, type PayloadAction } from '@reduxjs/toolkit';
import { authReducer, clearCredentials, setCredentials, type AuthState } from './authSlice';
import { clearStoredToken, readStoredToken, writeStoredToken } from './authStorage';
import type { AuthSession } from '../services/authApi';
import { workspacesReducer, type WorkspacesState } from './workspacesSlice';

// Keep token persistence beside the store so UI components only work with auth
// state and actions, not localStorage directly.
const authPersistenceMiddleware = createListenerMiddleware();

authPersistenceMiddleware.startListening({
  actionCreator: setCredentials,
  effect: async (action: PayloadAction<AuthSession>) => {
    writeStoredToken(action.payload.token);
  }
});

authPersistenceMiddleware.startListening({
  actionCreator: clearCredentials,
  effect: async () => {
    clearStoredToken();
  }
});

export type AppPreloadedState = {
  auth?: Partial<AuthState>;
  workspaces?: Partial<WorkspacesState>;
};

/**
 * Creates the application store and hydrates the auth token from storage when
 * an explicit preloaded state does not already provide one.
 */
export function createAppStore(preloadedState?: AppPreloadedState) {
  const tokenFromStorage = readStoredToken();

  return configureStore({
    reducer: {
      auth: authReducer,
      workspaces: workspacesReducer
    },
    preloadedState: {
      auth: {
        token: preloadedState?.auth?.token ?? tokenFromStorage ?? null,
        user: preloadedState?.auth?.user ?? null,
        status: preloadedState?.auth?.status ?? 'idle',
        error: preloadedState?.auth?.error ?? null
      },
      workspaces: {
        items: preloadedState?.workspaces?.items ?? [],
        activeWorkspaceId: preloadedState?.workspaces?.activeWorkspaceId ?? null,
        status: preloadedState?.workspaces?.status ?? 'idle',
        error: preloadedState?.workspaces?.error ?? null,
        hasLoaded: preloadedState?.workspaces?.hasLoaded ?? false
      }
    },
    middleware: (getDefaultMiddleware: any) =>
      getDefaultMiddleware().prepend(authPersistenceMiddleware.middleware)
  });
}

/**
 * Default application store used by the running frontend.
 */
export const appStore = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = {
  auth: AuthState;
  workspaces: WorkspacesState;
};
export type AppDispatch = AppStore['dispatch'];

