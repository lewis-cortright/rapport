import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppPage } from './AppPage';
import { renderWithProviders } from '../test/test-utils';

describe('AppPage', () => {
  it('renders the app shell details and logs out through Redux', async () => {
    const user = userEvent.setup();
    const { store } = renderWithProviders(<AppPage />, {
      route: '/app',
      preloadedState: { auth: { token: 'session:alex' } }
    });

    expect(screen.getByText(/Signed in as alex/i)).toBeInTheDocument();
    expect(screen.getByText(/Theme mode: light/i)).toBeInTheDocument();
    expect(screen.getByText('/api')).toBeInTheDocument();
    expect(screen.getByText(window.location.origin)).toBeInTheDocument();
    expect(screen.getByText('# general')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

    expect(screen.getByText(/Theme mode: dark/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Log out' }));

    expect(store.getState().auth.token).toBeNull();
  });

  it('falls back to a generic member label when no token is present', () => {
    renderWithProviders(<AppPage />, { route: '/app' });

    expect(screen.getByText(/Signed in as member/i)).toBeInTheDocument();
  });
});

