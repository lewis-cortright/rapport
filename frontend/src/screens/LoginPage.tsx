import { RapButton, RapFormField, RapTextInput } from '@rapport/ui';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../state/auth';
import styles from './AuthForm.module.css';

/**
 * Collects login credentials and hands the submission off to the shared auth
 * state layer.
 */
export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Clear any stale auth error when the screen is re-entered.
    auth.clearError();
  }, []);

  return (
    <AuthLayout mode="login">
      <form
        className={styles.form}
        onSubmit={async (event) => {
          event.preventDefault();

          try {
            await auth.login({ email, password });
            navigate('/app');
          } catch {
            // The shared auth state already stores the error for the UI.
          }
        }}
      >
        <RapFormField label="Email" htmlFor="login-email" hint="Use the email address associated with your account.">
          <RapTextInput id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </RapFormField>
        <RapFormField label="Password" htmlFor="login-password">
          <RapTextInput id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
        </RapFormField>
        {auth.error ? <p className={styles.error} role="alert">{auth.error}</p> : null}
        <RapButton type="submit" fullWidth disabled={auth.status === 'loading'}>
          Sign in
        </RapButton>
      </form>
    </AuthLayout>
  );
}

