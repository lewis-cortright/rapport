# Feature Walkthrough

Quick reference for exploring all of Rapport's features end-to-end.

## Setup Checklist

- [ ] Server running on `http://localhost:4000` (or deployed URL)
- [ ] Frontend running on `http://localhost:5173` (or deployed URL)
- [ ] MongoDB connected
- [ ] Run `cd server && npm run seed` to pre-populate test accounts and data (optional)

---

## Walkthrough Flow

### Part 1 — App overview

1. **Open the app**
   - The landing page redirects authenticated users to `/app` and unauthenticated users to `/login`.
   - The PWA is installable — look for the browser's "Add to Home Screen" or install prompt.

### Part 2 — Auth and workspace

2. **Register or log in**
   - Test accounts from the seed script: `owner@example.com` / `Test1234!` and `member@example.com` / `Test1234!`
   - JWT is issued on login and stored in `localStorage` for session restoration on reload.

3. **Explore the workspace sidebar**
   - The owner badge (orange pill) and member badge (neutral pill) show the current role.
   - Authorization is enforced on the backend — hiding UI controls is supplementary, not the security mechanism.

4. **Select the `general` channel**
   - Every workspace auto-provisions a default `general` channel on creation.

### Part 3 — Real-time messaging

5. **Open a second browser window and join by invite code**
   - Paste the invite code from the workspace details panel.
   - The second session sees its role as member.

6. **Send a message from the first window**
   - The message is persisted in MongoDB first, then broadcast to the room via Socket.IO.
   - Note the colored avatar circle next to each message — derived deterministically from the username.

7. **Reply from the second window**
   - Both sessions receive the message in real time without polling.
   - Auto-scroll keeps the latest message visible.

7a. **Watch the typing indicator**
   - Start typing in one window without submitting.
   - The other window shows "X is typing…" in real time.
   - The indicator clears automatically after 2.5 seconds of no keystrokes or on message send.

8. **Reload the first window**
   - Messages reload from the REST API — MongoDB is the source of truth.

### Part 4 — Channel switching and authorization

9. **Create a second channel `announcements` as the owner**
   - Only owners can create channels; the server enforces this with a 403 response.

10. **Switch to `announcements` in the second window**
    - Messages from `general` do not appear — Socket.IO rooms isolate channel traffic.

11. **Attempt to create a channel as the member**
    - The create form is not shown; a message explains the restriction.

### Part 5 — PWA

12. **Check PWA installability**
    - Open DevTools → Application → Manifest to verify the manifest.
    - On mobile, the browser should offer an "Add to Home Screen" prompt.
    - The Workbox service worker precaches the app shell; the offline fallback page shows when the network is unavailable.

---

## Technical Reference

- **Auth**: JWT + bcrypt. `GET /api/auth/me` restores sessions from token.
- **Channel isolation**: Socket.IO rooms keyed by channel ID. `channel:join` validates membership before admission.
- **Typing indicator**: `typing:start` / `typing:stop` are relayed peer-only via `socket.to(room)` — no server state.
- **Persist-then-broadcast**: `message:send` persists to MongoDB first; the confirmed payload is broadcast so history and real-time are always consistent.
- **Rate limiting**: 20 auth requests per 15-minute window per IP.

