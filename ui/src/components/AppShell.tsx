import type { PropsWithChildren, ReactNode } from 'react';
import styles from './AppShell.module.css';

export type AppShellProps = PropsWithChildren<{
  sidebar: ReactNode;
  header?: ReactNode;
}>;

export function AppShell({ sidebar, header, children }: AppShellProps) {
  return (
	<div className={styles.shell}>
	  <aside className={styles.sidebar}>{sidebar}</aside>
	  <div className={[styles.content, header ? styles.withHeader : styles.withoutHeader].join(' ')}>
		{header ? <header className={styles.header}>{header}</header> : null}
		<main className={styles.main}>{children}</main>
	  </div>
	</div>
  );
}


