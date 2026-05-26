import { AppShell, Button, Card, Field, SectionHeading, TextInput, useTheme } from '@rapport/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../state/auth';
import { useChannels } from '../state/channels';
import { useMessages } from '../state/messages';
import { useSocketChannel } from '../state/socket';
import { useTyping } from '../state/typing';
import { useWorkspaces } from '../state/workspaces';
import { appConfig } from '../config/appConfig';
import styles from './AppPage.module.css';

/**
 * Returns the wall-clock time portion of an ISO date string formatted for
 * display next to a chat message.
 */
function formatMessageTime(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Derives a stable accent color from a username string.
 * The palette is chosen to have good contrast on both light and dark backgrounds.
 */
function getUserAvatarColor(username: string): string {
  const palette = [
    '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#009688', '#43a047', '#f57c00',
    '#e53935', '#607d8b'
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) & 0x7fffffff;
  }
  return palette[hash % palette.length];
}

/**
 * Returns up to two characters suitable for use as avatar initials.
 */
function getUserAvatarInitials(username: string): string {
  const parts = username.trim().split(/[\s_-]+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

/**
 * Formats a natural-language typing indicator label.
 * e.g. "alice is typing…", "alice and bob are typing…", "3 people are typing…"
 */
function formatTypingLabel(users: string[]): string {
  if (users.length === 0) return '';
  if (users.length === 1) return `${users[0]} is typing…`;
  if (users.length === 2) return `${users[0]} and ${users[1]} are typing…`;
  return `${users.length} people are typing…`;
}

/**
 * Main authenticated workspace shell shown after login or registration.
 */
export function AppPage() {
  const auth = useAuth();
  const channels = useChannels();
  const messages = useMessages();
  const workspaces = useWorkspaces();
  const theme = useTheme();

  // Manage Socket.IO connection, channel room membership, and real-time
  // message delivery for the current authenticated session.
  const { sendTyping } = useSocketChannel();
  const { typingUsers } = useTyping();
  const sessionLabel = useMemo(() => auth.user?.username || auth.user?.email || 'member', [auth.user]);
  const [workspaceName, setWorkspaceName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [channelName, setChannelName] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const activeWorkspaceLabel = workspaces.activeWorkspace?.name ?? 'No workspace selected yet';

  // Ref to the bottom sentinel element — scrolled into view whenever the
  // message list grows so the newest messages stay visible.
  const messagesEndRef = useRef<HTMLLIElement>(null);

  // Timer ref used to auto-emit typing:stop after the user pauses for 2.5 s.
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(() => {
    if (!auth.isAuthenticated || !workspaces.activeWorkspace || channels.hasLoadedCurrentWorkspace || channels.status === 'loading') {
      return;
    }

    void channels.loadChannels().catch(() => undefined);
  }, [auth.isAuthenticated, channels, workspaces.activeWorkspace]);

  useEffect(() => {
    if (!auth.isAuthenticated || !channels.activeChannel || messages.hasLoadedCurrentChannel || messages.status === 'loading') {
      return;
    }

    void messages.loadMessages().catch(() => undefined);
  }, [auth.isAuthenticated, channels.activeChannel, messages]);

  // Scroll the message list to the bottom whenever new messages arrive so
  // the most recent message is always visible without manual scrolling.
  // Guard with typeof so jsdom test environments that lack scrollIntoView
  // do not throw during unit tests.
  useEffect(() => {
    const el = messagesEndRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.items]);

  function handleCopyInviteCode() {
    const code = workspaces.activeWorkspace?.inviteCode;
    if (!code) return;
    void navigator.clipboard.writeText(code).then(() => {
      setCopiedInviteCode(true);
      setTimeout(() => setCopiedInviteCode(false), 2000);
    });
  }

  /**
   * Called on every keystroke in the message input.
   * Emits typing:start immediately then schedules typing:stop if no further
   * keystrokes arrive within 2.5 seconds.
   */
  function handleMessageChange(value: string) {
    setMessageContent(value);

    if (value.trim()) {
      sendTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(false);
        typingTimeoutRef.current = null;
      }, 2500);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      sendTyping(false);
    }
  }

  return (
    <AppShell
      mobileNavigationLabel="Navigation"
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
                    <span className={styles.workspaceMeta}>
                      <span className={workspace.role === 'owner' ? styles.roleBadgeOwner : styles.roleBadgeMember}>
                        {workspace.role}
                      </span>
                      {' · '}{workspace.memberCount} member{workspace.memberCount === 1 ? '' : 's'}
                    </span>
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
            {channels.activeChannel ? <p className={styles.mutedText}>Active channel: #{channels.activeChannel.name}</p> : null}
            <p className={styles.mutedText}>Theme mode: {theme.mode}</p>
            <div className={styles.sessionActions}>
              <Button variant="ghost" fullWidth onClick={theme.toggleMode}>
                Switch to {theme.mode === 'light' ? 'dark' : 'light'} mode
              </Button>
              <Button variant="secondary" fullWidth onClick={() => {
                messages.clearError();
                channels.clearError();
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
          {!workspaces.activeWorkspace ? <p className={styles.mutedText}>Select a workspace to load its channels.</p> : null}
          {workspaces.activeWorkspace && channels.status === 'loading' && !channels.hasLoadedCurrentWorkspace ? (
            <p className={styles.mutedText}>Loading channels…</p>
          ) : null}
          {workspaces.activeWorkspace && !channels.items.length && channels.hasLoadedCurrentWorkspace ? (
            <p className={styles.mutedText}>No channels yet. Owners can create the next one from here.</p>
          ) : null}
          <ul className={styles.navList}>
            {channels.items.map((channel) => (
              <li key={channel.id}>
                <button
                  type="button"
                  className={`${styles.workspaceButton} ${channels.activeChannel?.id === channel.id ? styles.workspaceButtonActive : ''}`}
                  onClick={() => channels.selectChannel(channel.id)}
                >
                  <span className={styles.workspaceName}># {channel.name}</span>
                  <span className={styles.workspaceMeta}>{channels.activeChannel?.id === channel.id ? 'active channel' : 'select channel'}</span>
                </button>
              </li>
            ))}
          </ul>
          {workspaces.activeWorkspace?.role === 'owner' ? (
            <form
              className={styles.formStack}
              onSubmit={async (event) => {
                event.preventDefault();

                try {
                  await channels.createChannel({ name: channelName });
                  setChannelName('');
                } catch {
                  // Channel state already stores the user-facing error.
                }
              }}
            >
              <Field label="Channel name" htmlFor="channel-name" hint="Use lowercase names like general, frontend, or product-updates.">
                <TextInput id="channel-name" value={channelName} onChange={(event) => setChannelName(event.target.value)} placeholder="frontend" />
              </Field>
              <Button type="submit" variant="secondary" fullWidth disabled={channels.status === 'loading' || !workspaces.activeWorkspace}>
                Create channel
              </Button>
            </form>
          ) : null}
          {workspaces.activeWorkspace?.role === 'member' ? <p className={styles.mutedText}>Only workspace owners can create channels in this MVP.</p> : null}
          {channels.error ? <p className={styles.errorText} role="alert">{channels.error}</p> : null}
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
                <dd className={styles.configValue}>
                  <span className={styles.inviteCodeValue}>{workspaces.activeWorkspace.inviteCode}</span>
                  <Button variant="ghost" onClick={handleCopyInviteCode}>
                    {copiedInviteCode ? 'Copied!' : 'Copy'}
                  </Button>
                </dd>
              </div>
              <div className={styles.configItem}>
                <dt className={styles.configTerm}>Members</dt>
                <dd className={styles.configValue}>{workspaces.activeWorkspace.memberCount}</dd>
              </div>
              <div className={styles.configItem}>
                <dt className={styles.configTerm}>Active channel</dt>
                <dd className={styles.configValue}>{channels.activeChannel ? `# ${channels.activeChannel.name}` : 'No channel selected yet'}</dd>
              </div>
            </dl>
          ) : (
            <p className={styles.mutedText}>Select a workspace to see its invite code and role context.</p>
          )}
        </Card>
        <Card className={styles.messagesCard}>
          <strong>Messages{channels.activeChannel ? ` — #${channels.activeChannel.name}` : ''}</strong>
          {!channels.activeChannel ? <p className={styles.mutedText}>Select a channel to load its recent messages.</p> : null}
          {channels.activeChannel && messages.status === 'loading' && !messages.hasLoadedCurrentChannel ? <p className={styles.mutedText}>Loading messages…</p> : null}
          {channels.activeChannel && !messages.items.length && messages.hasLoadedCurrentChannel ? <p className={styles.mutedText}>No messages yet. Start the conversation below.</p> : null}
          {messages.items.length ? (
            <ul className={styles.messageList}>
              {messages.items.map((message) => (
                <li
                  key={message.id}
                  className={`${styles.messageItem}${message.optimisticId ? ` ${styles.messageItemPending}` : ''}`}
                >
                  <span
                    className={styles.messageAvatar}
                    style={{ background: getUserAvatarColor(message.author.username) }}
                    aria-hidden
                  >
                    {getUserAvatarInitials(message.author.username)}
                  </span>
                  <div className={styles.messageItemBody}>
                    <div className={styles.messageHeader}>
                      <strong className={styles.messageAuthor}>{message.author.username}</strong>
                      <time className={styles.messageTimestamp} dateTime={message.createdAt}>
                        {message.optimisticId ? (
                          <span className={styles.messageSendingBadge} aria-label="Sending">Sending…</span>
                        ) : (
                          formatMessageTime(message.createdAt)
                        )}
                      </time>
                    </div>
                    <p className={styles.messageBody}>{message.content}</p>
                  </div>
                </li>
              ))}
              {/* Sentinel element scrolled into view when new messages arrive */}
              <li ref={messagesEndRef} aria-hidden />
            </ul>
          ) : null}
          {typingUsers.length > 0 ? (
            <p className={styles.typingIndicator} role="status" aria-live="polite">
              {formatTypingLabel(typingUsers)}
            </p>
          ) : null}
          <form
            className={styles.formStack}
            onSubmit={async (event) => {
              event.preventDefault();
              if (!messageContent.trim()) return;

              // Cancel pending typing timeout and signal stopped typing before send.
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
              }
              sendTyping(false);

              // Clear the input immediately — the optimistic message is already
              // visible so the composer should be ready for the next message.
              const content = messageContent;
              setMessageContent('');

              try {
                await messages.sendMessage({ content });
              } catch {
                // Message state already stores the user-facing error.
                // Restore the input so the user can correct and retry.
                setMessageContent(content);
              }
            }}
          >
            <Field label="Message" htmlFor="message-content" hint="Send a short text update to the active channel.">
              <TextInput
                id="message-content"
                value={messageContent}
                onChange={(event) => handleMessageChange(event.target.value)}
                placeholder="Hello team"
              />
            </Field>
            <Button type="submit" fullWidth disabled={!channels.activeChannel || !messageContent.trim()}>
              Send message
            </Button>
          </form>
          {messages.error ? <p className={styles.errorText} role="alert">{messages.error}</p> : null}
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

