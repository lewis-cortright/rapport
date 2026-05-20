import { Card, SectionHeading } from '@rapport/ui';
import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

export function AuthLayout({ children, mode }: PropsWithChildren<{ mode: 'login' | 'register' }>) {
  return (
    <div className={styles.page}>
      <Card tone="elevated" className={styles.card}>
        <SectionHeading
          eyebrow="Account access"
          title={mode === 'login' ? 'Welcome back' : 'Create your account'}
          description="Sign in to continue your conversations, or create an account to get started with Rapport."
        />
        <div className={styles.content}>{children}</div>
        <div className={styles.footer}>
          {mode === 'login' ? (
            <span>
              Need an account? <Link to="/register">Register</Link>
            </span>
          ) : (
            <span>
              Already have an account? <Link to="/login">Log in</Link>
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}

