import { Button, Field, TextInput } from '@rapport/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../state/auth';
import styles from './AuthForm.module.css';

export function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <AuthLayout mode="login">
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          auth.login(`session:${email || 'member'}`);
          navigate('/app');
        }}
      >
        <Field label="Email" htmlFor="login-email" hint="Use the email address associated with your account.">
          <TextInput id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <TextInput id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
        </Field>
        <Button type="submit" fullWidth>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

