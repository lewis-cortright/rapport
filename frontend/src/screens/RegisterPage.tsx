import { RapButton, RapFormField, RapTextInput } from '@rapport/ui';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../state/auth';
import styles from './AuthForm.module.css';

/**
 * Collects registration details and creates a new authenticated session through
 * the shared auth state layer.
 */
export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Clear any stale auth error when the screen is re-entered.
    auth.clearError();
  }, []);

  return (
    <AuthLayout mode="register">
      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();

          try {
            await auth.register({ username, email, password });
            navigate('/app');
          } catch {
            // The shared auth state already stores the error for the UI.
          }
        }}
      >
        <RapFormField label="Username" htmlFor="register-username" hint="3–32 characters. Letters, numbers, underscores, and hyphens only — not your email address.">
          <RapTextInput id="register-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="rapport-builder" />
        </RapFormField>
        <RapFormField label="Email" htmlFor="register-email">
          <RapTextInput id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </RapFormField>
        <RapFormField label="Password" htmlFor="register-password" hint="Create a secure password to protect your account.">
          <RapTextInput id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Choose a secure password" />
        </RapFormField>
        {auth.error ? <p className={styles.error} role="alert">{auth.error}</p> : null}
        <RapButton type="submit" fullWidth disabled={auth.status === 'loading'}>
          Create account
        </RapButton>
      </form>
    </AuthLayout>
  );
}

