import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export type RapCardProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  padded?: boolean;
  tone?: 'default' | 'elevated';
};

export function RapCard({ children, padded = true, tone = 'default', className, style, ...props }: RapCardProps) {
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

