import { AppShell, Button, Card, Field, SectionHeading, TextInput, useTheme } from '@rapport/ui';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../state/auth';
import { useWorkspaces } from '../state/workspaces';
import { appConfig } from '../config/appConfig';
import styles from './AppPage.module.css';

const sampleChannels = ['general', 'frontend', 'server'];

/**
 * Main authenticated workspace shell shown after login or registration.
 */
export function AppPage() {
  const auth = useAuth();
  const workspaces = useWorkspaces();
  const theme = useTheme();
  const sessionLabel = useMemo(() => auth.user?.username || auth.user?.email || 'member', [auth.user]);
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const activeWorkspaceLabel = workspaces.activeWorkspace?.name ?? 'No workspace selected yet';

  useEffect(() => {
    // When a token was restored from storage but user details were not yet
    // loaded, hydrate the current user once on entry.
    if (!auth.token || auth.user || auth.status === 'loading') {
      return;
    }

    void auth.restoreSession().catch(() => undefined);
  }, [auth]);

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user || workspaces.hasLoaded || workspaces.status === 'loading') {
      return;
    }

    void workspaces.loadWorkspaces().catch(() => undefined);
  }, [auth.isAuthenticated, auth.user, workspaces]);

  return (
    <AppShell
      header={<strong>Team communication, channels, and account access stay organized inside {activeWorkspaceLabel}.</strong>}
      sidebar={
        <div className={styles.sidebarStack}>
          <SectionHeading eyebrow="Navigation" title="Rapport" description="Stay connected across workspaces, channels, and conversations." />
          <Card>
            <strong>Workspaces</strong>
            {workspaces.status === 'loading' && !workspaces.hasLoaded ? <p className={styles.mutedText}>Loading workspaces…</p> : null}
            {!workspaces.items.length && workspaces.hasLoaded ? <p className={styles.mutedText}>No workspaces yet. Create one or join with an invite code.</p> : null}
            <ul className={styles.navList}>
              {workspaces.items.map((workspace) => (
                <li key={workspace.id}>
                  <button
                    type="button"
                    className={`${styles.workspaceButton} ${workspaces.activeWorkspace?.id === workspace.id ? styles.workspaceButtonActive : ''}`}
                    onClick={() => workspaces.selectWorkspace(workspace.id)}
                  >
                    <span className={styles.workspaceName}>{workspace.name}</span>
                    <span className={styles.workspaceMeta}>{workspace.role} · {workspace.memberCount} member{workspace.memberCount === 1 ? '' : 's'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <strong>Create workspace</strong>
            <form
              className={styles.formStack}
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  await workspaces.createWorkspace({ name: workspaceName });
                  setWorkspaceName('');
                } catch {
                  // Workspace state already stores the user-facing error.
                }
              }}
            >
              <Field label="Workspace name" htmlFor="workspace-name" hint="Choose the name teammates will see in the sidebar.">
                <TextInput id="workspace-name" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} placeholder="Rapport Core" />
              </Field>
              <Button type="submit" fullWidth disabled={workspaces.status === 'loading'}>
                Create workspace
              </Button>
            </form>
          </Card>
          <Card>
            <strong>Join by invite code</strong>
            <form
              className={styles.formStack}
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  await workspaces.joinWorkspace({ inviteCode });
                  setInviteCode('');
                } catch {
                  // Workspace state already stores the user-facing error.
                }
              }}
            >
              <Field label="Invite code" htmlFor="workspace-invite-code" hint="Paste the shared code to join an existing workspace.">
                <TextInput id="workspace-invite-code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="CORE1234" />
              </Field>
              <Button type="submit" variant="secondary" fullWidth disabled={workspaces.status === 'loading'}>
                Join workspace
              </Button>
            </form>
            {workspaces.error ? <p className={styles.errorText} role="alert">{workspaces.error}</p> : null}
          </Card>
          <Card>
            <strong>Current session</strong>
            <p className={styles.mutedText}>Signed in as {sessionLabel}</p>
            {auth.token && !auth.user && auth.status === 'loading' ? <p className={styles.mutedText}>Restoring your session…</p> : null}
            {workspaces.activeWorkspace ? <p className={styles.mutedText}>Active workspace: {workspaces.activeWorkspace.name}</p> : null}
            <p className={styles.mutedText}>Theme mode: {theme.mode}</p>
            <div className={styles.sessionActions}>
              <Button variant="ghost" fullWidth onClick={theme.toggleMode}>
                Switch to {theme.mode === 'light' ? 'dark' : 'light'} mode
              </Button>
              <Button variant="secondary" fullWidth onClick={() => {
                workspaces.clearError();
                auth.logout();
              }}>
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
            title={workspaces.activeWorkspace ? workspaces.activeWorkspace.name : 'Welcome to Rapport'}
            description={
              workspaces.activeWorkspace
                ? `Invite teammates with ${workspaces.activeWorkspace.inviteCode} and keep channels organized for ${workspaces.activeWorkspace.memberCount} member${workspaces.activeWorkspace.memberCount === 1 ? '' : 's'}.`
                : 'Create or join a workspace to start organizing channels and conversations.'
            }
          />
        </Card>
        <Card>
          <strong>Channels</strong>
          <p className={styles.mutedText}>Channels will hang off {workspaces.activeWorkspace?.name ?? 'your next workspace'} during the Day 4 implementation.</p>
          <ul className={styles.navList}>
            {sampleChannels.map((channel) => (
              <li key={channel} className={styles.navListItem}># {channel}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <strong>Workspace details</strong>
          {workspaces.activeWorkspace ? (
            <dl className={styles.configList}>
              <div className={styles.configItem}>
                <dt className={styles.configTerm}>Role</dt>
                <dd className={styles.configValue}>{workspaces.activeWorkspace.role}</dd>
              </div>
              <div className={styles.configItem}>
                <dt className={styles.configTerm}>Invite code</dt>
                <dd className={styles.configValue}>{workspaces.activeWorkspace.inviteCode}</dd>
              </div>
              <div className={styles.configItem}>
                <dt className={styles.configTerm}>Members</dt>
                <dd className={styles.configValue}>{workspaces.activeWorkspace.memberCount}</dd>
              </div>
            </dl>
          ) : (
            <p className={styles.mutedText}>Select a workspace to see its invite code and role context.</p>
          )}
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

