import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/authApi', () => ({
  fetchCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  registerAccount: vi.fn()
}));

import { LoginPage } from './LoginPage';
import { loginWithPassword } from '../services/authApi';
import { renderWithProviders } from '../test/test-utils';

describe('LoginPage', () => {
  it('logs in through the Redux auth flow and persists the authenticated session', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<LoginPage />, { route: '/login' });

    vi.mocked(loginWithPassword).mockResolvedValueOnce({
      token: 'jwt.token',
      user: {
        id: 'user-1',
        username: 'builder',
        email: 'person@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'person@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'super-secret');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(vi.mocked(loginWithPassword)).toHaveBeenCalledWith({
      email: 'person@example.com',
      password: 'super-secret'
    });
    expect(store.getState().auth.token).toBe('jwt.token');
    expect(store.getState().auth.user?.username).toBe('builder');
    expect(window.localStorage.getItem('rapport.auth.token')).toBe('jwt.token');
  });

  it('shows the server error when login fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    vi.mocked(loginWithPassword).mockRejectedValueOnce(new Error('Invalid email or password.'));

    await user.type(screen.getByPlaceholderText('you@example.com'), 'person@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('falls back to a generic message when login rejects with a non-Error value', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    vi.mocked(loginWithPassword).mockRejectedValueOnce('unexpected rejection');

    await user.type(screen.getByPlaceholderText('you@example.com'), 'person@example.com');
    await user.type(screen.getByPlaceholderText('••••••••'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to sign in.');
  });
});

