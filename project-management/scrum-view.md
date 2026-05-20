# MERN Real-Time Chat PWA — Scrum View

> Generated from `project-management/scrum-data.json` by `project-management/scripts/update-scrum-view.mjs`.

## Mission

Build and deploy a polished MERN stack real-time chat PWA within nine days to demonstrate full-stack engineering ability, React competency, Node/Express API design, MongoDB schema modeling, Socket.IO real-time communication, authentication, authorization, deployment discipline, and interview-ready technical communication.

**Positioning:** A real-time team chat PWA built with MongoDB, Express, React, Node, Socket.IO, JWT authentication, role-based workspace/channel access, and MongoDB message persistence.

## Current Sprint

- **Name:** Nine-Day Interview MVP
- **Status:** active
- **Dates:** 2026-05-20 → 2026-05-28
- **Goal:** Deliver a deployed MERN real-time chat PWA with authentication, workspaces, channels, persisted messages, Socket.IO real-time delivery, PWA installability, and interview-ready documentation.
- **Active focus day:** Day 1 — Foundation (2026-05-20)

## Sprint Progress

- **Completion:** 1/30 active sprint tasks done (3%)
- **In Progress:** 1
- **Blocked:** 0
- **Todo:** 28
- **Done:** 1

- Day 1 — Foundation (2026-05-20): 1 done, 1 in progress, 0 blocked, 3 todo
- Day 2 — Authentication (2026-05-21): 0 done, 0 in progress, 0 blocked, 4 todo
- Day 3 — Workspaces (2026-05-22): 0 done, 0 in progress, 0 blocked, 4 todo
- Day 4 — Channels (2026-05-23): 0 done, 0 in progress, 0 blocked, 3 todo
- Day 5 — Message Persistence (2026-05-24): 0 done, 0 in progress, 0 blocked, 3 todo
- Day 6 — Real-Time Messaging (2026-05-25): 0 done, 0 in progress, 0 blocked, 3 todo
- Day 7 — UI Polish and Authorization Hardening (2026-05-26): 0 done, 0 in progress, 0 blocked, 3 todo
- Day 8 — PWA and Deployment (2026-05-27): 0 done, 0 in progress, 0 blocked, 3 todo
- Day 9 — Interview Readiness (2026-05-28): 0 done, 0 in progress, 0 blocked, 2 todo

## Quality Gates

- [pending] QG-001 — Local development boots cleanly
  - Frontend starts without runtime errors
  - Server starts without runtime errors
  - MongoDB connection succeeds
  - Health endpoint returns success
- [pending] QG-002 — Authentication is functional
  - User can register
  - User can log in
  - Protected routes reject unauthenticated requests
  - Authenticated session can be restored
- [pending] QG-003 — Authorization is enforced server-side
  - Users cannot access workspaces they do not belong to
  - Users cannot access channels in unauthorized workspaces
  - Members cannot perform owner-only actions
  - Socket events validate membership before joining rooms
- [pending] QG-004 — Real-time messaging works
  - Messages are persisted
  - Messages broadcast to active channel members
  - Channel switching does not leak messages
  - Reconnect does not create duplicate listeners
- [pending] QG-005 — PWA installability works
  - Manifest is valid
  - App has icons
  - App can be installed
  - Offline fallback works
- [pending] QG-006 — Deployment is interview-ready
  - Frontend is deployed
  - Server is deployed on the droplet
  - MongoDB Community is installed and reachable on the droplet
  - Nginx is configured for the app and API
  - Production environment variables are configured
  - README includes live demo URL

## Today / Next Focus

**Day 1 — Foundation (2026-05-20)**

Goal: Stand up the repo shape, define the delivery plan, and make the project-management system operational.

Tasks:
- [in-progress] [must] TASK-001 — Set up frontend app scaffold
  - Area: frontend
  - Day: Day 1 — Foundation
  - Description: Initialize the React/Vite frontend structure and baseline routing so the UI can boot locally.
  - Acceptance: Frontend app folder exists under frontend/; Local start command is defined; Routing shell is ready for auth and workspace views
  - Dependencies: None
  - Notes: Prefer Vite + TypeScript unless existing repo structure suggests otherwise.; Keep styling setup lightweight for speed.; Do not place frontend source files in the repository root; keep them inside frontend/.; Consume shared design-system components from ui/ rather than duplicating primitives inside the app.
- [todo] [must] TASK-002 — Set up server app scaffold
  - Area: backend
  - Day: Day 1 — Foundation
  - Description: Initialize the Node/Express server structure with a health endpoint and configuration loading.
  - Acceptance: Server app folder exists under server/; Local start command is defined; Health endpoint returns success
  - Dependencies: None
  - Notes: Keep bootstrap minimal and production-minded.; Reserve room for auth, workspace, channel, and message routes.; Do not place server source files in the repository root; keep them inside server/.
- [todo] [must] TASK-003 — Add MongoDB connection, env examples, and health check
  - Area: database
  - Day: Day 1 — Foundation
  - Description: Define environment variables, connect MongoDB, and verify the server can report healthy startup state.
  - Acceptance: MongoDB connection succeeds locally; Environment variable examples exist; Health endpoint reflects DB readiness appropriately
  - Dependencies: TASK-002
  - Notes: Production will use MongoDB Community installed on the Ubuntu droplet rather than MongoDB Atlas.; Keep env naming consistent across local and production deployments.
- [todo] [should] TASK-030 — Set up custom UI component library scaffold
  - Area: frontend
  - Day: Day 1 — Foundation
  - Description: Create a separate ui project for shared components, design tokens, and reusable layout primitives consumed by the frontend.
  - Acceptance: UI library folder exists under ui/; Shared component strategy is documented; Frontend can later consume reusable components from the UI library
  - Dependencies: None
  - Notes: Keep the first pass intentionally small: buttons, inputs, layout shells, and navigation primitives.; Do not mix reusable presentation code into server/ or project-management/.

Day acceptance criteria:
- Frontend starts locally
- Server starts locally
- Server health endpoint works
- MongoDB connection succeeds
- Scrum system can generate scrum-view.md

Day notes:
- Keep Day 1 focused on bootstrapping and planning discipline.
- Use separate top-level frontend/, server/, and ui/ directories from the start.
- Avoid overdesigning internals before auth and data flows are clear.

## In Progress

- [in-progress] [must] TASK-001 — Set up frontend app scaffold
  - Area: frontend
  - Day: Day 1 — Foundation
  - Description: Initialize the React/Vite frontend structure and baseline routing so the UI can boot locally.
  - Acceptance: Frontend app folder exists under frontend/; Local start command is defined; Routing shell is ready for auth and workspace views
  - Dependencies: None
  - Notes: Prefer Vite + TypeScript unless existing repo structure suggests otherwise.; Keep styling setup lightweight for speed.; Do not place frontend source files in the repository root; keep them inside frontend/.; Consume shared design-system components from ui/ rather than duplicating primitives inside the app.

## Blocked

- No blocked tasks right now.

## Done

- [done] [must] TASK-004 — Create scrum source of truth, generated view, and README skeleton plan
  - Area: project-management
  - Day: Day 1 — Foundation
  - Description: Create the planning system, ADRs, notes, and generator so the team can review scope and progress quickly.
  - Acceptance: scrum-data.json exists and is populated; update-scrum-view.mjs generates scrum-view.md; Planning docs are interview-friendly
  - Dependencies: None
  - Notes: This task is being completed by the current workspace update.; Root README skeleton created at the repository root.; README remains a tracked Day 9 delivery item for the fully deployed app workstream.

## Backlog

### Must

- [todo] [must] TASK-101 — Set up frontend app
  - Area: frontend
  - Day: Backlog
  - Description: Create the frontend application shell and local dev workflow.
  - Acceptance: Frontend starts locally and provides the app shell.
  - Dependencies: None
  - Notes: Covered by Day 1 planning and TASK-001.; Frontend project should live under frontend/.
- [todo] [must] TASK-102 — Set up server app
  - Area: backend
  - Day: Backlog
  - Description: Create the server application shell and local dev workflow.
  - Acceptance: Server starts locally and exposes a health endpoint.
  - Dependencies: None
  - Notes: Covered by Day 1 planning and TASK-002.; Server project should live under server/.
- [todo] [must] TASK-103 — Connect MongoDB
  - Area: database
  - Day: Backlog
  - Description: Connect the server to MongoDB using environment-based configuration.
  - Acceptance: MongoDB connection succeeds in local development.
  - Dependencies: TASK-102
  - Notes: Covered by Day 1 planning and TASK-003.
- [todo] [must] TASK-104 — Implement auth
  - Area: backend
  - Day: Backlog
  - Description: Deliver registration, login, JWT, current-user, and password hashing.
  - Acceptance: User can register, log in, and restore a session.
  - Dependencies: TASK-102, TASK-103
  - Notes: Covered by Day 2 tasks.
- [todo] [must] TASK-105 — Implement workspace creation
  - Area: backend
  - Day: Backlog
  - Description: Allow authenticated users to create workspaces with owner membership.
  - Acceptance: Authenticated user can create a workspace.
  - Dependencies: TASK-104
  - Notes: Covered by Day 3 tasks.
- [todo] [must] TASK-106 — Implement invite-code join
  - Area: backend
  - Day: Backlog
  - Description: Allow authenticated users to join a workspace by invite code.
  - Acceptance: User can join a workspace by invite code.
  - Dependencies: TASK-105
  - Notes: Covered by Day 3 tasks.
- [todo] [must] TASK-107 — Implement channel creation
  - Area: backend
  - Day: Backlog
  - Description: Support general channel provisioning and owner-only channel creation.
  - Acceptance: Owner can create channels and members cannot.
  - Dependencies: TASK-105
  - Notes: Covered by Day 4 tasks.
- [todo] [must] TASK-108 — Implement message persistence
  - Area: database
  - Day: Backlog
  - Description: Store and retrieve channel messages from MongoDB.
  - Acceptance: Messages persist and reload on refresh.
  - Dependencies: TASK-107
  - Notes: Covered by Day 5 tasks.
- [todo] [must] TASK-109 — Implement Socket.IO real-time messaging
  - Area: realtime
  - Day: Backlog
  - Description: Broadcast persisted messages to channel participants in real time.
  - Acceptance: Two sessions can chat in real time without duplicates.
  - Dependencies: TASK-108
  - Notes: Covered by Day 6 tasks.
- [todo] [must] TASK-110 — Add route protection
  - Area: frontend
  - Day: Backlog
  - Description: Protect authenticated screens in the React application.
  - Acceptance: Unauthenticated users cannot access protected screens.
  - Dependencies: TASK-104
  - Notes: Covered by Day 2 tasks.
- [todo] [must] TASK-111 — Add server-side authorization
  - Area: backend
  - Day: Backlog
  - Description: Enforce membership and owner-only actions on the backend and socket handlers.
  - Acceptance: Unauthorized workspace and channel access is blocked server-side.
  - Dependencies: TASK-105, TASK-107, TASK-109
  - Notes: Covered by Day 7 tasks.
- [todo] [must] TASK-112 — Deploy frontend
  - Area: deployment
  - Day: Backlog
  - Description: Build the frontend and serve it from the DigitalOcean droplet through Nginx.
  - Acceptance: Frontend has a public URL.
  - Dependencies: TASK-109
  - Notes: Covered by Day 8 tasks.
- [todo] [must] TASK-113 — Deploy server
  - Area: deployment
  - Day: Backlog
  - Description: Deploy the Node API and Socket.IO server to the Ubuntu droplet behind Nginx.
  - Acceptance: Server is reachable through the droplet deployment.
  - Dependencies: TASK-109
  - Notes: Covered by Day 8 tasks.
- [todo] [must] TASK-114 — Configure MongoDB Community on the droplet
  - Area: deployment
  - Day: Backlog
  - Description: Install and configure MongoDB Community on the Ubuntu droplet for production use.
  - Acceptance: Production server connects to MongoDB Community on the droplet.
  - Dependencies: TASK-103
  - Notes: Covered by Day 8 tasks.
- [todo] [must] TASK-115 — Write README
  - Area: documentation
  - Day: Backlog
  - Description: Document what the project demonstrates, how to run it, and how to demo it.
  - Acceptance: README explains the project and includes deployment details.
  - Dependencies: TASK-112, TASK-113
  - Notes: Root README skeleton exists now; final README polish still depends on deployment details and live URLs.
- [todo] [must] TASK-116 — Write demo script
  - Area: documentation
  - Day: Backlog
  - Description: Create a short demo flow suitable for interviews.
  - Acceptance: Demo script fits inside five minutes.
  - Dependencies: TASK-112, TASK-113
  - Notes: Covered by Day 9 tasks.

### Should

- [todo] [should] TASK-117 — Add loading states
  - Area: frontend
  - Day: Backlog
  - Description: Show feedback while requests and channel transitions are in progress.
  - Acceptance: Major async flows show a visible loading state.
  - Dependencies: TASK-110
  - Notes: Covered by Day 7 tasks.
- [todo] [should] TASK-118 — Add error states
  - Area: frontend
  - Day: Backlog
  - Description: Handle failed auth, workspace, and message flows clearly.
  - Acceptance: Users receive understandable feedback on common failures.
  - Dependencies: TASK-110
  - Notes: Covered by Day 7 tasks.
- [todo] [should] TASK-119 — Add responsive layout
  - Area: frontend
  - Day: Backlog
  - Description: Adapt the UI for smaller and larger viewports.
  - Acceptance: Core app flows work on desktop and mobile widths.
  - Dependencies: TASK-110
  - Notes: Covered by Day 7 tasks.
- [todo] [should] TASK-120 — Add PWA manifest
  - Area: pwa
  - Day: Backlog
  - Description: Add a valid manifest for installability.
  - Acceptance: Manifest validates and supports install prompts.
  - Dependencies: TASK-101
  - Notes: Covered by Day 8 tasks.
- [todo] [should] TASK-121 — Add offline fallback
  - Area: pwa
  - Day: Backlog
  - Description: Provide a basic offline fallback page for interrupted connectivity.
  - Acceptance: Offline users see a graceful fallback page.
  - Dependencies: TASK-120
  - Notes: Covered by Day 8 tasks.
- [todo] [should] TASK-122 — Add basic smoke tests or manual test checklist
  - Area: documentation
  - Day: Backlog
  - Description: Define the checks used before demoing the product.
  - Acceptance: A repeatable smoke-test checklist exists.
  - Dependencies: TASK-111
  - Notes: Supported by deployment checklist and Day 8/9 validation work.
- [todo] [should] TASK-123 — Add architecture diagram or ASCII topology
  - Area: documentation
  - Day: Backlog
  - Description: Add a lightweight architecture diagram for interview explanation.
  - Acceptance: Architecture topology is documented in a readable form.
  - Dependencies: TASK-115
  - Notes: Can live inside architecture-overview.md.
- [todo] [should] TASK-124 — Add interview talking points
  - Area: documentation
  - Day: Backlog
  - Description: Prepare concise talking points about technical choices and tradeoffs.
  - Acceptance: Interview talking points are concise and credible.
  - Dependencies: TASK-115
  - Notes: Covered by the project-management notes set.
- [todo] [should] TASK-139 — Set up custom UI component library
  - Area: frontend
  - Day: Backlog
  - Description: Create a separate shared UI library for reusable visual primitives and app components.
  - Acceptance: UI library exists under ui/ and can be consumed by the frontend.
  - Dependencies: TASK-101
  - Notes: Covered by Day 1 planning and TASK-030.; Use the library to avoid duplicating base components inside frontend/.

### Could

- [todo] [could] TASK-125 — Add typing indicator
  - Area: realtime
  - Day: Backlog
  - Description: Show that another user is actively typing in the current channel.
  - Acceptance: Typing indicator appears only for active channel peers.
  - Dependencies: TASK-109
  - Notes: Nice-to-have only after the core message path is stable.
- [todo] [could] TASK-126 — Add presence indicator
  - Area: realtime
  - Day: Backlog
  - Description: Show simple online/offline presence for workspace members.
  - Acceptance: Presence state updates are visible and understandable.
  - Dependencies: TASK-109
  - Notes: Not required for the interview MVP.
- [todo] [could] TASK-127 — Add message edit/delete
  - Area: backend
  - Day: Backlog
  - Description: Allow authors to edit or delete their own messages.
  - Acceptance: Message edit/delete respects author ownership.
  - Dependencies: TASK-108, TASK-111
  - Notes: Only worth doing if the core MVP is comfortably done.
- [todo] [could] TASK-128 — Add optimistic message sending
  - Area: frontend
  - Day: Backlog
  - Description: Show outbound messages immediately before server confirmation.
  - Acceptance: Pending messages resolve cleanly to server-confirmed state.
  - Dependencies: TASK-109
  - Notes: Adds polish but also failure-state complexity.
- [todo] [could] TASK-129 — Add avatar colors
  - Area: frontend
  - Day: Backlog
  - Description: Give users a lightweight visual identity without file uploads.
  - Acceptance: Users display consistent avatar colors across sessions.
  - Dependencies: TASK-104
  - Notes: Can be derived from user profile data or generated heuristically.
- [todo] [could] TASK-130 — Add keyboard shortcuts
  - Area: frontend
  - Day: Backlog
  - Description: Improve usability with a few helpful keyboard shortcuts.
  - Acceptance: Shortcuts do not conflict with core browser expectations.
  - Dependencies: TASK-119
  - Notes: Only useful if the core UI is already stable.
- [todo] [could] TASK-131 — Add sample or demo seed data
  - Area: documentation
  - Day: Backlog
  - Description: Seed a small demo workspace to speed up presentations and testing.
  - Acceptance: Seed data can be created or reset quickly before a demo.
  - Dependencies: TASK-115
  - Notes: Useful if setup time becomes a demo risk.

### Won't for MVP

- [cut] [won't] TASK-132 — Voice chat
  - Area: realtime
  - Day: Backlog
  - Description: Do not implement voice chat in the MVP.
  - Acceptance: Voice chat remains explicitly out of scope.
  - Dependencies: None
  - Notes: Explicit non-goal for the nine-day MVP.
- [cut] [won't] TASK-133 — Video chat
  - Area: realtime
  - Day: Backlog
  - Description: Do not implement video chat in the MVP.
  - Acceptance: Video chat remains explicitly out of scope.
  - Dependencies: None
  - Notes: Explicit non-goal for the nine-day MVP.
- [cut] [won't] TASK-134 — File uploads
  - Area: backend
  - Day: Backlog
  - Description: Do not implement file uploads in the MVP.
  - Acceptance: File uploads remain explicitly out of scope.
  - Dependencies: None
  - Notes: Explicit non-goal for the nine-day MVP.
- [cut] [won't] TASK-135 — Direct messages
  - Area: frontend
  - Day: Backlog
  - Description: Do not implement direct messages in the MVP.
  - Acceptance: Direct messages remain explicitly out of scope.
  - Dependencies: None
  - Notes: Explicit non-goal for the nine-day MVP.
- [cut] [won't] TASK-136 — Push notifications
  - Area: pwa
  - Day: Backlog
  - Description: Do not implement push notifications in the MVP.
  - Acceptance: Push notifications remain explicitly out of scope.
  - Dependencies: None
  - Notes: Explicit non-goal for the nine-day MVP.
- [cut] [won't] TASK-137 — Advanced permissions
  - Area: backend
  - Day: Backlog
  - Description: Do not implement a complex permissions matrix in the MVP.
  - Acceptance: Authorization remains limited to owner/member role checks.
  - Dependencies: None
  - Notes: Explicit non-goal for the nine-day MVP.
- [cut] [won't] TASK-138 — Full Discord clone behavior
  - Area: project-management
  - Day: Backlog
  - Description: Do not position or build the product as a full Discord clone.
  - Acceptance: The project remains framed as a Discord-inspired MVP.
  - Dependencies: None
  - Notes: Explicit scope boundary for honest interview positioning.

## Risks

- [open] [high] RISK-001 — Scope creep
  - Mitigation: Keep the MVP limited to auth, workspaces, channels, persisted real-time messages, PWA installability, and deployment.
- [open] [medium] RISK-002 — Real-time complexity delays deployment
  - Mitigation: Implement REST-based message persistence first, then layer Socket.IO broadcasting over the working persistence path.
- [open] [high] RISK-003 — Deployment issues consume final day
  - Mitigation: Deploy a skeleton version early, then continuously deploy improvements.
- [open] [medium] RISK-004 — Overbuilding UI instead of core functionality
  - Mitigation: Use a simple, clean Discord-inspired layout and prioritize working flows over custom visual complexity.
- [open] [high] RISK-005 — Authorization gaps
  - Mitigation: Validate workspace membership and owner-only actions on the backend and in socket handlers, not only in the UI.

## Architecture Principles

- ARCH-001 — **Polished vertical slice over broad clone**: The project should demonstrate a complete, deployed, reliable MVP rather than a wide but unfinished Discord clone.
- ARCH-002 — **Server-side authorization is mandatory**: All workspace, channel, message, and socket access must be validated on the backend.
- ARCH-003 — **Persist first, broadcast second**: Messages should be saved successfully before being broadcast to other clients.
- ARCH-004 — **Deployment is part of the product**: The app is not interview-ready until it can be accessed through a public URL and demonstrated from a clean account.
- ARCH-005 — **Every feature needs a demo path**: Features that cannot be shown clearly in a five-minute interview demo should be cut or deferred.
- ARCH-006 — **Separate frontend, server, and UI library project directories**: The React app should live under frontend/, the Node/Express app should live under server/, and the shared component library should live under ui/ so toolchains, env files, and reusable presentation code stay cleanly separated.
- ARCH-007 — **Single-droplet deployment should stay operationally simple**: Deploy the built frontend and the Node server to one Ubuntu droplet behind Nginx, with MongoDB Community installed on the same host, so the MVP remains easy to operate and explain.

## Deployment Status

- **Status:** not-started
- **Frontend URL:** TBD
- **Server URL:** TBD
- **Database Provider:** MongoDB Community (self-hosted on DigitalOcean droplet)

Environment variables:
- MONGODB_URI (required; server) — MongoDB connection string for local development and the MongoDB Community instance installed on the droplet.
- JWT_SECRET (required; server) — Secret used to sign and verify JWTs.
- PORT (optional; server) — Internal Node server listen port used behind Nginx on the droplet or by local development.
- CORS_ORIGIN (required; server) — Allowed origin for REST and Socket.IO access; may be the same public domain served by Nginx in production.
- VITE_API_BASE_URL (required; frontend) — Base URL for REST API requests from the frontend, ideally a same-origin path such as /api in production.
- VITE_SOCKET_URL (optional; frontend) — Optional Socket.IO URL override for the frontend; can be omitted when production uses the same public origin through Nginx.

Deployment checklist:
- [todo] DEP-001 — Provision the DigitalOcean Ubuntu droplet and basic server access
- [todo] DEP-002 — Install MongoDB Community, Node.js, and any process manager needed on the droplet
- [todo] DEP-003 — Build the frontend and make it available from the droplet deployment
- [todo] DEP-004 — Configure Nginx to serve the frontend and proxy API and Socket.IO traffic to the Node server
- [todo] DEP-005 — Configure production environment variables and same-origin CORS strategy
- [todo] DEP-006 — Run smoke test with a fresh account and two sessions
- [todo] DEP-007 — Update README and demo script with live URLs

## Interview Talking Points

- **30-second summary** — What the project is: I built a deployed MERN stack real-time chat PWA to demonstrate full-stack application design in the MERN ecosystem. It includes JWT authentication, workspace membership, owner/member authorization, text channels, persisted MongoDB messages, Socket.IO real-time delivery, and PWA installability. I intentionally scoped it as a polished vertical slice so I could show production-minded tradeoffs instead of an unfinished clone.
- **Architecture summary** — How the pieces fit: React handles the client experience, Express owns APIs and authorization, MongoDB stores the durable state, and Socket.IO handles channel-scoped real-time delivery after persistence succeeds.
- **Why MERN** — Why this stack: A JavaScript/TypeScript-friendly stack kept iteration speed high and let me focus on end-to-end product delivery rather than language boundaries.
- **Why Socket.IO** — Why this real-time approach: Socket.IO gave me practical room support, reconnection handling, and event semantics that fit a nine-day MVP better than building raw WebSocket infrastructure by hand.
- **Auth and authorization** — Security posture: The MVP uses JWT authentication, bcrypt password hashing, protected routes, and server-side membership checks so authorization does not depend on hidden UI controls.
- **MongoDB schema decisions** — Why these collections: The schema keeps user, workspace, channel, and message data separate while embedding workspace membership to make owner/member authorization checks straightforward.
- **PWA decisions** — Why lightweight PWA features: I prioritized installability, manifest support, icons, and a basic offline fallback rather than an overly complex offline-first data model.
- **Deployment decisions** — Why a single-droplet deployment: A single DigitalOcean droplet with Nginx and MongoDB Community keeps the deployment topology simple while still demonstrating real Linux server operations and a public production URL.
- **Tradeoffs** — What I intentionally cut: I explicitly cut voice, video, DMs, uploads, reactions, and complex permissions so I could complete a deployed, credible vertical slice.
- **Future improvements** — Where it could go next: The next logical steps are presence, typing indicators, message editing, better auth hardening, richer moderation, and deeper offline support.

## Recent Decisions

- 2026-05-20 — ADR-0001 — **Project scope is a Discord-inspired real-time chat MVP** (accepted): Build a serious team-chat vertical slice rather than attempting a full Discord clone.
- 2026-05-20 — ADR-0002 — **Socket.IO is the real-time transport for the MVP** (accepted): Use Socket.IO rooms and reconnection support to deliver practical real-time messaging in a short timeline.
- 2026-05-20 — ADR-0003 — **JWT plus bcrypt is the authentication strategy** (accepted): JWT-backed auth with bcrypt hashing is sufficient for this interview-focused MVP and easy to explain.
- 2026-05-20 — ADR-0004 — **Use a single DigitalOcean droplet for MVP deployment** (accepted): Use a single Ubuntu droplet on DigitalOcean with Nginx and MongoDB Community to keep deployment simple, cheap, and easy to explain.
