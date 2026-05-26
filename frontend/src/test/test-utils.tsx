import { render } from '@testing-library/react';
import type { PropsWithChildren, ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RapThemeProvider } from '@rapport/ui';
import { AuthProvider } from '../state/auth';
import { createAppStore, type AppPreloadedState, type AppStore } from '../state/store';

type RenderWithProvidersOptions = {
  route?: string;
  preloadedState?: AppPreloadedState;
  store?: AppStore;
};

export function renderWithProviders(ui: ReactElement, options: RenderWithProvidersOptions = {}) {
  const store = options.store ?? createAppStore(options.preloadedState);
  const route = options.route ?? '/';

  function Wrapper({ children }: PropsWithChildren) {
    return (
      <RapThemeProvider>
        <AuthProvider store={store}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </AuthProvider>
      </RapThemeProvider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper })
  };
}

