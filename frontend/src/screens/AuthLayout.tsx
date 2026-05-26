import { RapCard, RapSectionHeading } from '@rapport/ui';
import type { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import styles from './AuthLayout.module.css';

/**
 * Shared shell for the login and registration screens so both flows keep the
 * same structure, messaging, and cross-linking.
 */
export function AuthLayout({ children, mode }: PropsWithChildren<{ mode: 'login' | 'register' }>) {
  return (
    <div className={styles.page}>
      <RapCard tone="elevated" className={styles.RapCard}>
        <RapSectionHeading
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
      </RapCard>
    </div>
  );
}

