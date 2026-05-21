import { useMemo, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { fetchCurrentUser, loginWithPassword, registerAccount, type AuthUser } from '../services/authApi';
import { clearAuthError, clearCredentials, selectAuthError, selectAuthStatus, selectIsAuthenticated, selectToken, selectUser, setAuthError, setAuthPending, setCredentials, setCurrentUser } from './authSlice';
import { useAppDispatch, useAppSelector } from './hooks';
import { appStore, type AppStore } from './store';

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  username: string;
  email: string;
  password: string;
};

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  status: 'idle' | 'loading';
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  restoreSession: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
};

/**
 * Provides the shared Redux store used by the app's auth hooks.
 */
export function AuthProvider({ children, store = appStore }: PropsWithChildren<{ store?: AppStore }>) {
  return <Provider store={store}>{children}</Provider>;
}

/**
 * Exposes auth state and imperative auth actions in a React-friendly shape for
 * route guards and screen components.
 */
export function useAuth(): AuthContextValue {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const status = useAppSelector(selectAuthStatus);
  const error = useAppSelector(selectAuthError);

  return useMemo(
    () => ({
      token,
      user,
      isAuthenticated,
      status,
      error,
      async login(input: LoginInput) {
        dispatch(setAuthPending());

        try {
          const session = await loginWithPassword(input);
          dispatch(setCredentials(session));
        } catch (nextError) {
          dispatch(setAuthError(resolveErrorMessage(nextError, 'Unable to sign in.')));
          throw nextError;
        }
      },
      async register(input: RegisterInput) {
        dispatch(setAuthPending());

        try {
          const session = await registerAccount(input);
          dispatch(setCredentials(session));
        } catch (nextError) {
          dispatch(setAuthError(resolveErrorMessage(nextError, 'Unable to create your account.')));
          throw nextError;
        }
      },
      async restoreSession() {
        if (!token) {
          return;
        }

        dispatch(setAuthPending());

        try {
          const nextUser = await fetchCurrentUser(token);
          dispatch(setCurrentUser(nextUser));
        } catch (nextError) {
          dispatch(clearCredentials());
          throw nextError;
        }
      },
      logout() {
        dispatch(clearCredentials());
      },
      clearError() {
        dispatch(clearAuthError());
      }
    }),
    [dispatch, error, isAuthenticated, status, token, user]
  );
}

