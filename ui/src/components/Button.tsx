import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type RapButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function RapButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  style,
  ...props
}: RapButtonProps) {
  return (
    <button
      {...props}
      className={[styles.button, styles[variant], styles[size], fullWidth ? styles.fullWidth : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </button>
  );
}

