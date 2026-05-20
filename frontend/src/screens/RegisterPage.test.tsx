import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RegisterPage } from './RegisterPage';
import { renderWithProviders } from '../test/test-utils';

describe('RegisterPage', () => {
  it('creates a session using the username when provided', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByPlaceholderText('rapport-builder'), 'rapport-builder');
    await user.type(screen.getByPlaceholderText('you@example.com'), 'builder@example.com');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(store.getState().auth.token).toBe('session:rapport-builder');
  });

  it('falls back to the email when no username is provided', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.type(screen.getByPlaceholderText('you@example.com'), 'fallback@example.com');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(store.getState().auth.token).toBe('session:fallback@example.com');
  });

  it('falls back to a generic member when both username and email are blank', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<RegisterPage />, { route: '/register' });

    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(store.getState().auth.token).toBe('session:member');
  });
});

