import { AppShell, Button, Card, SectionHeading, useTheme } from '@rapport/ui';
import { useMemo } from 'react';
import { useAuth } from '../state/auth';
import { appConfig } from '../config/appConfig';
import styles from './AppPage.module.css';

const sampleWorkspaces = ['Rapport Core', 'Product Team'];
const sampleChannels = ['general', 'frontend', 'server'];

export function AppPage() {
  const auth = useAuth();
  const theme = useTheme();
  const sessionLabel = useMemo(() => auth.token?.replace('demo-token:', '') || 'member', [auth.token]);

  return (
    <AppShell
      header={<strong>Team communication, channels, and account access are available in one workspace.</strong>}
      sidebar={
        <div className={styles.sidebarStack}>
          <SectionHeading eyebrow="Navigation" title="Rapport" description="Stay connected across workspaces, channels, and conversations." />
          <Card>
            <strong>Workspaces</strong>
            <ul className={styles.navList}>
              {sampleWorkspaces.map((workspace) => (
                <li key={workspace} className={styles.navListItem}>{workspace}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <strong>Current session</strong>
            <p className={styles.mutedText}>Signed in as {sessionLabel}</p>
            <p className={styles.mutedText}>Theme mode: {theme.mode}</p>
            <div className={styles.sessionActions}>
              <Button variant="ghost" fullWidth onClick={theme.toggleMode}>
                Switch to {theme.mode === 'light' ? 'dark' : 'light'} mode
              </Button>
              <Button variant="secondary" fullWidth onClick={() => auth.logout()}>
                Log out
              </Button>
            </div>
          </Card>
        </div>
      }
    >
      <div className={styles.dashboardGrid}>
        <Card tone="elevated">
          <SectionHeading
            eyebrow="Overview"
            title="Welcome to Rapport"
            description="Manage your workspace, move between channels, and keep conversations accessible from a single unified interface."
          />
        </Card>
        <Card>
          <strong>Channels</strong>
          <ul className={styles.navList}>
            {sampleChannels.map((channel) => (
              <li key={channel} className={styles.navListItem}># {channel}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <strong>Runtime configuration</strong>
          <dl className={styles.configList}>
            <div className={styles.configItem}>
              <dt className={styles.configTerm}>API base URL</dt>
              <dd className={styles.configValue}>{appConfig.apiBaseUrl}</dd>
            </div>
            <div className={styles.configItem}>
              <dt className={styles.configTerm}>Socket URL</dt>
              <dd className={styles.configValue}>{appConfig.socketUrl}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </AppShell>
  );
}

