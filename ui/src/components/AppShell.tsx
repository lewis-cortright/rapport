import { useEffect, useId, useState, type ReactNode } from 'react';
import styles from './AppShell.module.css';

export type RapAppShellProps = {
  children?: ReactNode;
  sidebar: ReactNode;
  header?: ReactNode;
  mobileNavigationLabel?: string;
};

const MOBILE_BREAKPOINT_QUERY = '(max-width: 768px)';

function getInitialIsMobile() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
	? window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches
	: false;
}

export function RapAppShell({ sidebar, header, children, mobileNavigationLabel }: RapAppShellProps) {
  const sidebarId = useId();
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
	  return;
	}

	const mediaQueryList = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
	const updateIsMobile = (event?: MediaQueryListEvent) => {
	  setIsMobile(event?.matches ?? mediaQueryList.matches);
	};

	updateIsMobile();
	mediaQueryList.addEventListener('change', updateIsMobile);

	return () => {
	  mediaQueryList.removeEventListener('change', updateIsMobile);
	};
  }, []);

  useEffect(() => {
	if (!isMobile) {
	  setIsSidebarOpen(false);
	}
  }, [isMobile]);

  const showMobileNavigation = Boolean(mobileNavigationLabel) && isMobile;
  const showSidebar = !showMobileNavigation || isSidebarOpen;

  return (
	<div className={styles.shell}>
	  {showMobileNavigation && isSidebarOpen ? (
		<button
		  type="button"
		  className={styles.backdrop}
		  aria-label={`Dismiss ${mobileNavigationLabel} overlay`}
		  onClick={() => setIsSidebarOpen(false)}
		/>
	  ) : null}
	  <aside
		id={sidebarId}
		className={[
		  styles.sidebar,
		  showMobileNavigation ? styles.mobileSidebar : '',
		  showMobileNavigation && showSidebar ? styles.mobileSidebarOpen : ''
		]
		  .filter(Boolean)
		  .join(' ')}
		hidden={showMobileNavigation && !showSidebar}
	  >
		{sidebar}
	  </aside>
	  <div className={[styles.content, header || showMobileNavigation ? styles.withHeader : styles.withoutHeader].join(' ')}>
		{header || showMobileNavigation ? (
		  <header className={styles.header}>
			<div className={styles.headerBar}>
			  {showMobileNavigation ? (
				<button
				  type="button"
				  className={styles.navToggle}
				  aria-controls={sidebarId}
				  aria-expanded={isSidebarOpen}
				  onClick={() => setIsSidebarOpen((current) => !current)}
				>
				  {isSidebarOpen ? 'Close' : 'Open'} {mobileNavigationLabel}
				</button>
			  ) : null}
			  {header ? <div className={styles.headerContent}>{header}</div> : null}
			</div>
		  </header>
		) : null}
		<main className={styles.main}>{children}</main>
	  </div>
	</div>
  );
}


