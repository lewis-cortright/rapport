import type { HTMLAttributes, PropsWithChildren } from 'react';
import styles from './Card.module.css';

export type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    padded?: boolean;
    tone?: 'default' | 'elevated';
  }
>;

export function Card({ children, padded = true, tone = 'default', className, style, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={[styles.card, styles[tone], padded ? styles.padded : '', className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </div>
  );
}

