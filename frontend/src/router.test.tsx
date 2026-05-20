import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from './router';
import { renderWithProviders } from './test/test-utils';

describe('AppRouter', () => {
  it('redirects the root route to the login page when unauthenticated', () => {
    renderWithProviders(<AppRouter />, { route: '/' });

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('redirects unauthenticated users away from the protected app route', () => {
    renderWithProviders(<AppRouter />, { route: '/app' });

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
  });

  it('redirects authenticated users away from public auth routes', () => {
    renderWithProviders(<AppRouter />, {
      route: '/login',
      preloadedState: { auth: { token: 'demo-token:redux-user' } }
    });

    expect(screen.getByText(/Signed in as redux-user/i)).toBeInTheDocument();
  });
});

