import { configureStore, createListenerMiddleware, type PayloadAction } from '@reduxjs/toolkit';
import { authReducer, clearCredentials, setCredentials, type AuthState } from './authSlice';
import { clearStoredToken, readStoredToken, writeStoredToken } from './authStorage';

const authPersistenceMiddleware = createListenerMiddleware();

authPersistenceMiddleware.startListening({
  actionCreator: setCredentials,
  effect: async (action: PayloadAction<string>) => {
    writeStoredToken(action.payload);
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
};

export function createAppStore(preloadedState?: AppPreloadedState) {
  const tokenFromStorage = readStoredToken();

  return configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: {
        token: preloadedState?.auth?.token ?? tokenFromStorage ?? null
      }
    },
    middleware: (getDefaultMiddleware: any) =>
      getDefaultMiddleware().prepend(authPersistenceMiddleware.middleware)
  });
}

export const appStore = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];

