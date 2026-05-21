import { Button, Field, TextInput } from '@rapport/ui';
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
        <Field label="Email" htmlFor="login-email" hint="Use the email address associated with your account.">
          <TextInput id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <TextInput id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
        </Field>
        {auth.error ? <p className={styles.error} role="alert">{auth.error}</p> : null}
        <Button type="submit" fullWidth disabled={auth.status === 'loading'}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

