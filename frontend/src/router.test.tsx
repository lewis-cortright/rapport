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
      preloadedState: {
        auth: {
          token: 'jwt.token',
          user: {
            id: 'user-1',
            username: 'redux-user',
            email: 'redux@example.com',
            createdAt: '2026-05-20T00:00:00.000Z',
            updatedAt: '2026-05-20T00:00:00.000Z'
          }
        },
        workspaces: {
          hasLoaded: true
        }
      }
    });

    expect(screen.getByText(/Signed in as redux-user/i)).toBeInTheDocument();
  });
});

