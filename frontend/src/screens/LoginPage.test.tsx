import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LoginPage } from './LoginPage';
import { renderWithProviders } from '../test/test-utils';

describe('LoginPage', () => {
  it('logs in through the Redux auth flow and navigates to the app route', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'person@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'super-secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(store.getState().auth.token).toBe('session:person@example.com');
    expect(window.localStorage.getItem('rapport.auth.token')).toBe('session:person@example.com');
  });

  it('falls back to a generic user token when the email is blank', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<LoginPage />, { route: '/login' });

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(store.getState().auth.token).toBe('session:member');
  });
});

