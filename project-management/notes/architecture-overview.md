# Architecture Overview

## System Overview

`mern-chat-pwa` is a Discord-inspired real-time team chat PWA built with the MERN stack. The system is intentionally scoped as a focused vertical slice: authentication, workspaces, channels, durable messages, real-time delivery, installability, and public deployment.

## Repository Layout

The repository should keep the client, server, and shared UI library as separate top-level projects:

```text
frontend/              React + Vite + TypeScript application
server/                Node + Express + Socket.IO application
ui/                    Custom shared UI component library
project-management/    Scrum data, generated view, ADRs, and notes
README.md              Repo-level overview and setup guidance
```

This separation keeps the frontend build toolchain, server runtime, shared component work, and environment configuration isolated while preserving a single place for planning and documentation.

## Frontend Responsibilities

The frontend is responsible for:

- Register and login flows
- Authenticated route protection
- Current-user session restoration
- Workspace sidebar and active workspace state
- Channel navigation and active channel state
- Message list rendering and composer interactions
- Socket connection lifecycle on the client
- Responsive layout and PWA installability UX

## UI Library Responsibilities

The custom UI component library is responsible for:

- Shared design tokens and visual primitives
- Reusable buttons, inputs, layout shells, and navigation building blocks
- Consistent styling patterns for auth, workspace, channel, and chat surfaces
- A clean separation between app logic in `frontend/` and reusable presentation code in `ui/`

## Server Responsibilities

The server is responsible for:

- Registration and login endpoints
- Password hashing and JWT issuance
- Auth middleware and current-user endpoint
- Workspace creation, listing, and invite-code join
- Channel creation and listing
- Message validation, persistence, and retrieval
- Server-side authorization for REST and Socket.IO
- Socket authentication, room join validation, and message broadcast

## Backend HTTP Layer Separation

The server is split into four distinct areas to keep concerns isolated:

```text
server/src/
  app.ts              Composition root — wires services, middleware, and routers
  config/             Environment variable parsing (env.ts)
  controllers/        Thin HTTP handlers that translate requests into service calls
    auth.ts
    channels.ts
    messages.ts
    system.ts
    workspaces.ts
  http/               Shared HTTP utilities used by all controllers and routes
    authentication.ts   createRequireAuthenticatedUser middleware + getAuthenticatedUser
    route-params.ts     getSingleRouteParam — normalises Express param widening
    service-errors.ts   sendServiceError — maps domain errors to HTTP responses
  routes/             Express router modules mounted by app.ts
    auth.ts             POST /register, POST /login, GET /me (+ rate limiter)
    channels.ts         GET /, POST / under /:workspaceId/channels
    messages.ts         GET /, POST / under /:workspaceId/channels/:channelId/messages
    system.ts           GET /api/health, GET /
    workspaces.ts       GET /, POST /, POST /join
  services/           Domain logic — no Express or Socket.IO imports
    auth.ts
    channels.ts
    db.ts
    messages.ts
    workspaces.ts
  sockets/
    chat.ts             Authenticated Socket.IO connection + channel room + broadcast
```

The boundary rule: services never import from `http/`, `routes/`, or `controllers/`. Controllers never import from `routes/`. This makes services independently testable and keeps swapping the HTTP framework theoretical.

## MongoDB Collections

### Core Models

```text
type User = {
  _id: ObjectId;
  username: string;
  email: string;
  passwordHash: string;
  avatarColor: string | undefined;
  createdAt: Date;
  updatedAt: Date;
};

type Workspace = {
  _id: ObjectId;
  name: string;
  ownerId: ObjectId;
  inviteCode: string;
  members: Array<{
    userId: ObjectId;
    role: 'owner' | 'member';
    joinedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
};

type Channel = {
  _id: ObjectId;
  workspaceId: ObjectId;
  name: string;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type Message = {
  _id: ObjectId;
  workspaceId: ObjectId;
  channelId: ObjectId;
  authorId: ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
```

### Collection Notes

- `Workspace.members` is embedded to simplify membership and owner/member checks.
- `Channel` stays intentionally narrow in scope: text channels only.
- `Message` stores both `workspaceId` and `channelId` so authorization and query paths remain straightforward.

## Socket.IO Event Flow

1. The client authenticates through the normal login flow and stores session state.
2. The client opens a Socket.IO connection using authenticated context.
3. The server validates the identity before accepting the socket.
4. When the active channel changes, the client leaves the previous room and joins the next one.
5. On send, the server validates access, persists the message, then broadcasts the saved payload to the room.
6. On refresh, the client reloads recent messages from the REST API so the database remains the source of truth.

## Authorization Flow

1. A user authenticates and receives a JWT.
2. Protected REST routes on the server validate the token.
3. Workspace routes verify membership before returning data.
4. Channel routes verify workspace membership and owner-only creation rules.
5. Message routes verify the requester belongs to the parent workspace/channel.
6. Socket room joins repeat membership checks server-side.

## Deployment Topology

A simple production topology looks like this:

```text
Browser / Installed PWA
        |
        | HTTPS + Socket.IO
        v
Nginx on Ubuntu Droplet (DigitalOcean)
        |
        | serves frontend build + proxies /api and Socket.IO
        v
Node + Express + Socket.IO Server
        |
        | Mongoose
        v
MongoDB Community on the same droplet
```

This is intentionally a monolith-style deployment for the MVP. It reduces moving parts, keeps costs low, and is easy to reason about: one server, one reverse proxy, one Node process, and one MongoDB installation.

## Known Limitations

- No voice or video chat
- No direct messages
- No uploads
- No advanced permissions matrix beyond owner/member roles
- No push notifications
- No offline-first data sync beyond a basic service-worker-cached app shell
- No end-to-end encryption
- Message history limited to 50 most recent messages per channel
- Single-host deployment — no horizontal scaling or sticky sessions

## Known Tradeoffs Worth Discussing in Interviews

| Decision | Tradeoff |
|----------|----------|
| Embedded `Workspace.members` array | Simpler auth queries; doesn't scale beyond thousands of members |
| JWT without a token revocation store | Simpler implementation; logged-out tokens remain valid until expiry |
| `message:new` broadcast includes sender | Consistent message state for the sender; client deduplicates by ID |
| Monolith deployment on one droplet | Zero infrastructure complexity; no horizontal scale |
| 50-message REST pagination limit | Keeps response size bounded; full history requires pagination work |
| Service worker `autoUpdate` strategy | Ensures fresh code; users silently get updates on next navigation |
| `socket.io-client` singleton per token | Prevents duplicate connections; one reconnect path to reason about |
