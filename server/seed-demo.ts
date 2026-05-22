#!/usr/bin/env node
/**
 * Seed script
 *
 * Creates two test accounts, a shared workspace, several channels, and a
 * handful of seeded messages so the deployment is ready to explore without
 * needing to manually set everything up first.
 *
 * Usage (while the server is running):
 *
 *   # Against local dev server
 *   npx tsx seed-demo.ts
 *
 *   # Against a deployed server (set BASE_URL in the environment)
 *   BASE_URL=https://your-domain.com npx tsx seed-demo.ts
 *
 * The script is idempotent for account creation: it attempts a login before
 * registering so re-running after a partial failure works cleanly.
 * Workspace and channel creation is NOT idempotent — re-running on an already
 * seeded database will create duplicate workspaces.
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4000';

// ---------------------------------------------------------------------------
// Test accounts
// ---------------------------------------------------------------------------

const OWNER = { username: 'alice', email: 'owner@example.com', password: 'Test1234!' };
const MEMBER = { username: 'bob', email: 'member@example.com', password: 'Test1234!' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiPost<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`POST ${path} → ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

async function apiGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GET ${path} → ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Account bootstrap (register OR login if already exists)
// ---------------------------------------------------------------------------

async function getOrCreateAccount(
  account: typeof OWNER
): Promise<{ token: string; user: { id: string; username: string } }> {
  // Try login first so the script is safe to re-run after partial failures.
  try {
    const result = await apiPost<{ token: string; user: { id: string; username: string } }>(
      '/api/auth/login',
      { email: account.email, password: account.password }
    );
    console.log(`  ✓ Logged in as ${account.username}`);
    return result;
  } catch {
    // Login failed — try to register instead.
  }

  const result = await apiPost<{ token: string; user: { id: string; username: string } }>(
    '/api/auth/register',
    account
  );
  console.log(`  ✓ Registered ${account.username}`);
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nRapport Seed`);
  console.log(`API base: ${BASE_URL}\n`);

  // ------ Accounts ----------------------------------------------------------
  console.log('Bootstrapping accounts…');
  const ownerSession = await getOrCreateAccount(OWNER);
  const memberSession = await getOrCreateAccount(MEMBER);
  const ownerToken = ownerSession.token;
  const memberToken = memberSession.token;

  // ------ Workspace ---------------------------------------------------------
  console.log('\nCreating workspace…');
  const workspace = await apiPost<{
    id: string;
    name: string;
    inviteCode: string;
    role: string;
  }>('/api/workspaces', { name: 'Rapport' }, ownerToken);
  console.log(`  ✓ Workspace "${workspace.name}" — invite code: ${workspace.inviteCode}`);

  // ------ Member joins via invite code -------------------------------------
  console.log('\nJoining workspace as member…');
  await apiPost('/api/workspaces/join', { inviteCode: workspace.inviteCode }, memberToken);
  console.log(`  ✓ ${MEMBER.username} joined`);

  // ------ Channels ----------------------------------------------------------
  console.log('\nCreating channels…');

  const general = await apiGet<Array<{ id: string; name: string }>>(
    `/api/workspaces/${workspace.id}/channels`,
    ownerToken
  ).then((channels) => channels.find((c) => c.name === 'general')!);
  console.log(`  ✓ Using auto-provisioned #general`);

  const announcements = await apiPost<{ id: string; name: string }>(
    `/api/workspaces/${workspace.id}/channels`,
    { name: 'announcements' },
    ownerToken
  );
  console.log(`  ✓ Created #${announcements.name}`);

  const random = await apiPost<{ id: string; name: string }>(
    `/api/workspaces/${workspace.id}/channels`,
    { name: 'random' },
    ownerToken
  );
  console.log(`  ✓ Created #${random.name}`);

  // ------ Messages in #general ---------------------------------------------
  console.log('\nSeeding messages in #general…');

  const generalMessages = [
    { author: ownerToken, content: 'Welcome to Rapport! 👋' },
    { author: memberToken, content: 'Thanks for the invite! This is great.' },
    { author: ownerToken, content: 'Feel free to explore the channels. Owners can create new ones.' },
    { author: memberToken, content: 'Love the real-time delivery — no page refresh needed.' },
    { author: ownerToken, content: 'Exactly — Socket.IO rooms handle channel isolation automatically.' }
  ];

  for (const { author, content } of generalMessages) {
    await apiPost(
      `/api/workspaces/${workspace.id}/channels/${general.id}/messages`,
      { content },
      author
    );
    process.stdout.write('  .');
  }
  console.log(` ${generalMessages.length} messages`);

  // ------ Messages in #announcements ----------------------------------------
  console.log('\nSeeding messages in #announcements…');

  const announcementMessages = [
    { author: ownerToken, content: 'This channel is for important announcements only.' },
    { author: ownerToken, content: 'Only workspace owners can create new channels — members can view and post.' }
  ];

  for (const { author, content } of announcementMessages) {
    await apiPost(
      `/api/workspaces/${workspace.id}/channels/${announcements.id}/messages`,
      { content },
      author
    );
    process.stdout.write('  .');
  }
  console.log(` ${announcementMessages.length} messages`);

  // ------ Summary -----------------------------------------------------------
  console.log('\n✅ Seed complete!\n');
  console.log('Test credentials:');
  console.log(`  Owner:  ${OWNER.email} / ${OWNER.password}`);
  console.log(`  Member: ${MEMBER.email} / ${MEMBER.password}`);
  console.log(`\nInvite code: ${workspace.inviteCode}`);
  console.log('\nOpen two windows side-by-side to explore real-time messaging.\n');
}

main().catch((error) => {
  console.error('\n❌ Seed failed:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
