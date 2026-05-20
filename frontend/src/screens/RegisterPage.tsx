import { Button, Field, TextInput } from '@rapport/ui';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from './AuthLayout';
import { useAuth } from '../state/auth';
import styles from './AuthForm.module.css';

export function RegisterPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  return (
    <AuthLayout mode="register">
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          auth.login(`demo-token:${username || email || 'new-user'}`);
          navigate('/app');
        }}
      >
        <Field label="Username" htmlFor="register-username">
          <TextInput id="register-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="rapport-builder" />
        </Field>
        <Field label="Email" htmlFor="register-email">
          <TextInput id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Password" htmlFor="register-password" hint="Create a secure password to protect your account.">
          <TextInput id="register-password" type="password" placeholder="Choose a secure password" />
        </Field>
        <Button type="submit" fullWidth>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}

