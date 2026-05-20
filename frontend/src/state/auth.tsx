import { useMemo, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';
import { clearCredentials, selectIsAuthenticated, selectToken, setCredentials } from './authSlice';
import { useAppDispatch, useAppSelector } from './hooks';
import { appStore, type AppStore } from './store';

type AuthContextValue = {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
};

export function AuthProvider({ children, store = appStore }: PropsWithChildren<{ store?: AppStore }>) {
  return <Provider store={store}>{children}</Provider>;
}

export function useAuth(): AuthContextValue {
  const dispatch = useAppDispatch();
  const token = useAppSelector(selectToken);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return useMemo(
    () => ({
      token,
      isAuthenticated,
      login(nextToken: string) {
        dispatch(setCredentials(nextToken));
      },
      logout() {
        dispatch(clearCredentials());
      }
    }),
    [dispatch, isAuthenticated, token]
  );
}

