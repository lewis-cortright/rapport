import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    fullWidth?: boolean;
  }
>;

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  style,
  ...props
}: ButtonProps) {
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

