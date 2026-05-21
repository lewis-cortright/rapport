# Demo Script

Target duration: under five minutes.

## Pre-Demo Checklist

- [ ] Deployed URL open and responsive in browser
- [ ] Owner demo account credentials handy
- [ ] Fresh "member" account ready in an incognito window
- [ ] Both windows visible side-by-side or easy to switch between
- [ ] Workspace "Rapport Demo" with at least one message already exists
- [ ] Invite code copied to clipboard

---

## Demo Flow

### Part 1 — App overview (30 s)

1. **Open the deployed app**
   - "This is Rapport — a Discord-inspired real-time team chat PWA I built in the MERN stack over nine days."
   - Mention the tech: React + Redux, Express, Socket.IO, MongoDB, Vite PWA.

### Part 2 — Auth and workspace (1 min)

2. **Log in as the owner account**
   - Mention: JWT, bcrypt, protected REST routes, auth middleware on every sensitive endpoint.

3. **Show the workspace sidebar**
   - Point out the owner badge (orange pill).  
   - "Authorization is enforced on the backend — not just by hiding buttons in the UI."

4. **Select the `general` channel**
   - "Every workspace auto-provisions a default `general` channel on creation."

### Part 3 — Real-time messaging (1.5 min)

5. **Open an incognito window and join by invite code**
   - Paste the code, join as a member.
   - Show the member badge (neutral pill) in the sidebar.

6. **Both windows on `general` — send from the owner window**
   - "The message is persisted in MongoDB first, then broadcast to the room."
   - Show instant delivery in the member window.

7. **Reply from the member window**
   - Show delivery back to the owner session.
   - Point out timestamps and auto-scroll.

8. **Refresh the owner window**
   - "MongoDB is the source of truth — messages reload from the REST API on reconnect."

### Part 4 — Channel switching and authorization (45 s)

9. **Owner creates a second channel `announcements`**
   - Mention: owner-only creation enforced server-side with a 403.

10. **Switch to `announcements` in the member window**
    - Show that the `general` messages do not appear in `announcements`.
    - "Switching channels leaves the previous Socket.IO room and joins the new one."

11. **Try creating a channel as the member**
    - Show the UI message: "Only workspace owners can create channels in this MVP."

### Part 5 — PWA and close (30 s)

12. **Mobile or DevTools — show PWA install prompt**
    - "The Workbox service worker precaches the app shell for offline use."
    - Mention the offline fallback page and `manifest.webmanifest`.

13. **Close with scope framing**
    - "I scoped this as a polished vertical slice — auth, workspaces, channels, real-time messages, PWA, and deployment. Items I deliberately deferred include direct messages, file uploads, and push notifications."

---

## Optional Narration Cues

- "Authorization is enforced on the backend — the frontend just reflects what the server allows."
- "I used Socket.IO because it gave me reconnection, rooms, and acknowledgements without spending the whole timeline on raw WebSocket plumbing."
- "Messages are persisted before being broadcast so the REST history endpoint and the real-time stream are always consistent."
- "The service worker uses an autoUpdate strategy — users get fresh code silently on the next navigation."
- "The product is only considered done once it is deployed and demoable from a clean account."
- "I added rate limiting to the auth endpoints — 20 requests per 15-minute window — as a minimal brute-force guard."
