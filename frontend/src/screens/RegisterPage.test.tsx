import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/authApi', () => ({
  fetchCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  registerAccount: vi.fn()
}));

import { RegisterPage } from './RegisterPage';
import { registerAccount } from '../services/authApi';
import { renderWithProviders } from '../test/test-utils';

describe('RegisterPage', () => {
  it('creates an authenticated session using the registration API response', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<RegisterPage />, { route: '/register' });

    vi.mocked(registerAccount).mockResolvedValueOnce({
      token: 'jwt.token',
      user: {
        id: 'user-1',
        username: 'rapport-builder',
        email: 'builder@example.com',
        createdAt: '2026-05-20T00:00:00.000Z',
        updatedAt: '2026-05-20T00:00:00.000Z'
      }
    });

    await user.type(screen.getByPlaceholderText('rapport-builder'), 'rapport-builder');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'builder@example.com');
    await user.type(screen.getByPlaceholderText('Choose a secure password'), 'super-secret');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(vi.mocked(registerAccount)).toHaveBeenCalledWith({
      username: 'rapport-builder',
      email: 'builder@example.com',
      password: 'super-secret'
    });
    expect(store.getState().auth.token).toBe('jwt.token');
    expect(store.getState().auth.user?.username).toBe('rapport-builder');
  });

  it('shows the server error when registration fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />, { route: '/register' });

    vi.mocked(registerAccount).mockRejectedValueOnce(new Error('Username must be at least 3 characters long.'));

    await user.type(screen.getByPlaceholderText('you@example.com'), 'fallback@example.com');
    await user.type(screen.getByPlaceholderText('Choose a secure password'), 'super-secret');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Username must be at least 3 characters long.');
  });
});

