import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthLayout } from './AuthLayout';
import { renderWithProviders } from '../test/test-utils';

describe('AuthLayout', () => {
  it('renders the login variant copy and link', () => {
    renderWithProviders(<AuthLayout mode="login">login content</AuthLayout>, { route: '/login' });

    expect(screen.getByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByText('login content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Register' })).toHaveAttribute('href', '/register');
  });

  it('renders the register variant copy and link', () => {
    renderWithProviders(<AuthLayout mode="register">register content</AuthLayout>, { route: '/register' });

    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument();
    expect(screen.getByText('register content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });
});

