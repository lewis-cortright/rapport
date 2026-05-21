import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../services/authApi', () => ({
  fetchCurrentUser: vi.fn(),
  loginWithPassword: vi.fn(),
  registerAccount: vi.fn()
}));

import { useAuth } from './auth';
import { fetchCurrentUser } from '../services/authApi';
import { setAuthError } from './authSlice';
import { renderWithProviders } from '../test/test-utils';

function AuthHarness() {
  const auth = useAuth();

  return (
    <>
      <div data-testid="token">{auth.token ?? 'none'}</div>
      <div data-testid="status">{auth.status}</div>
      <button
        onClick={() => {
          void auth.restoreSession().catch(() => undefined);
        }}
      >
        Restore session
      </button>
      <button onClick={auth.clearError}>Clear error</button>
    </>
  );
}

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early when restoreSession is called without a token', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<AuthHarness />);

    await user.click(screen.getByRole('button', { name: 'Restore session' }));

    expect(vi.mocked(fetchCurrentUser)).not.toHaveBeenCalled();
    expect(store.getState().auth.token).toBeNull();
    expect(screen.getByTestId('status')).toHaveTextContent('idle');
  });

  it('clears stored credentials when restoring the session fails', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<AuthHarness />, {
      preloadedState: {
        auth: {
          token: 'jwt.token',
          error: 'stale error'
        }
      }
    });

    vi.mocked(fetchCurrentUser).mockRejectedValueOnce(new Error('Session expired'));

    await user.click(screen.getByRole('button', { name: 'Restore session' }));

    await waitFor(() => {
      expect(store.getState().auth.token).toBeNull();
    });
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.error).toBeNull();

    store.dispatch(setAuthError('temporary error'));
    await user.click(screen.getByRole('button', { name: 'Clear error' }));
    expect(store.getState().auth.error).toBeNull();
  });
});

