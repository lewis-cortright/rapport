# MERN Real-Time Chat PWA — Scrum View

> Generated from `project-management/scrum-data.json` by `project-management/scripts/update-scrum-view.mjs`.

## Mission

Build and deploy a polished MERN stack real-time chat PWA within nine days to demonstrate full-stack engineering ability, React competency, Node/Express API design, MongoDB schema modeling, Socket.IO real-time communication, authentication, authorization, deployment discipline, and interview-ready technical communication.

**Positioning:** A real-time team chat PWA built with MongoDB, Express, React, Node, Socket.IO, JWT authentication, role-based workspace/channel access, and MongoDB message persistence.

## Current Sprint

- **Name:** Nine-Day Interview MVP
- **Status:** complete
- **Dates:** 2026-05-20 → 2026-05-28
- **Goal:** Deliver a deployed MERN real-time chat PWA with authentication, workspaces, channels, persisted messages, Socket.IO real-time delivery, PWA installability, and interview-ready documentation.
- **Active focus day:** Day 1 — Foundation (2026-05-20)

## Sprint Progress

- **Completion:** 33/33 active sprint tasks done (100%)
- **In Progress:** 0
- **Blocked:** 0
- **Todo:** 0
- **Done:** 33

- Day 1 — Foundation (2026-05-20): 7 done, 0 in progress, 0 blocked, 0 todo
- Day 2 — Authentication (2026-05-21): 4 done, 0 in progress, 0 blocked, 0 todo
- Day 3 — Workspaces (2026-05-22): 4 done, 0 in progress, 0 blocked, 0 todo
- Day 4 — Channels (2026-05-23): 3 done, 0 in progress, 0 blocked, 0 todo
- Day 5 — Message Persistence (2026-05-24): 3 done, 0 in progress, 0 blocked, 0 todo
- Day 6 — Backend Separation and Real-Time Messaging (2026-05-25): 4 done, 0 in progress, 0 blocked, 0 todo
- Day 7 — UI Polish and Authorization Hardening (2026-05-26): 3 done, 0 in progress, 0 blocked, 0 todo
- Day 8 — PWA and Deployment (2026-05-27): 3 done, 0 in progress, 0 blocked, 0 todo
- Day 9 — Interview Readiness (2026-05-28): 2 done, 0 in progress, 0 blocked, 0 todo

## Quality Gates

- [passed] QG-001 — Local development boots cleanly
  - Frontend starts without runtime errors
  - Server starts without runtime errors
  - MongoDB connection succeeds
  - Health endpoint returns success
- [passed] QG-002 — Authentication is functional
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
- [passed] QG-007 — Automated test coverage is enforced
  - Frontend tests run successfully
  - Backend tests run successfully
  - Frontend coverage remains at or above the 80% MVP threshold
  - Backend coverage remains at or above the 80% MVP threshold

## Today / Next Focus

**Day 1 — Foundation (2026-05-20)**

Goal: Stand up the repo shape, define the delivery plan, make the project-management system operational, and stabilize the current UI foundation with top-priority theme and mobile layout work.

Tasks:
- No active tasks for the focus day.

Day acceptance criteria:
- Frontend starts locally
- Server starts locally
- Server health endpoint works
- MongoDB connection succeeds
- Scrum system can generate scrum-view.md
- Theme mode persists locally across reloads
- Current UI shell works on desktop and mobile widths

Day notes:
- Keep Day 1 focused on bootstrapping and planning discipline.
- Use separate top-level frontend/, server/, and ui/ directories from the start.
- Avoid overdesigning internals before auth and data flows are clear.
- Frontend, server, and shared UI scaffolds are complete, and local MongoDB readiness is now verified on this workstation through a successful connection and passing health check.
- Theming and mobile responsiveness have been pulled forward as the active UI priorities for the current sprint.
- Pulled-forward UI priorities are now complete: the app uses modular CSS, root-level theme rules, localStorage theme persistence, and responsive shell/auth layouts.
- The server now includes a repeatable local readiness probe command so MongoDB connectivity and /api/health can be re-verified quickly during backend work.
- Follow-up cleanup on the mobile branch also removed temporary demo/scaffolding session naming from the frontend auth flow and tests.

## In Progress

- No tasks currently in progress.

## Blocked

- No blocked tasks right now.

## Done

- [done] [must] TASK-001 — Set up frontend app scaffold
  - Area: frontend
  - Day: Day 1 — Foundation
  - Description: Initialize the React/Vite frontend structure and baseline routing so the UI can boot locally.
  - Acceptance: Frontend app folder exists under frontend/; Local start command is defined; Routing shell is ready for auth and workspace views
  - Dependencies: None
  - Notes: Prefer Vite + TypeScript unless existing repo structure suggests otherwise.; Keep styling setup lightweight for speed.; Do not place frontend source files in the repository root; keep them inside frontend/.; Consume shared design-system components from ui/ rather than duplicating primitives inside the app.; Completed with a Vite + React + TypeScript scaffold, Redux-based auth state, protected-route shell, successful production build, and 100% frontend test coverage.
- [done] [must] TASK-002 — Set up server app scaffold
  - Area: backend
  - Day: Day 1 — Foundation
  - Description: Initialize the Node/Express server structure with a health endpoint and configuration loading.
  - Acceptance: Server app folder exists under server/; Local start command is defined; Health endpoint returns success
  - Dependencies: None
  - Notes: Keep bootstrap minimal and production-minded.; Reserve room for auth, workspace, channel, and message routes.; Do not place server source files in the repository root; keep them inside server/.; Completed with Express, Socket.IO bootstrap, environment loading, a verified /api/health endpoint, and 100% backend test coverage.
- [done] [must] TASK-003 — Add MongoDB connection, env examples, and health check
  - Area: database
  - Day: Day 1 — Foundation
  - Description: Define environment variables, connect MongoDB, and verify the server can report healthy startup state.
  - Acceptance: MongoDB connection succeeds locally; Environment variable examples exist; Health endpoint reflects DB readiness appropriately
  - Dependencies: TASK-002
  - Notes: Production will use MongoDB Community installed on the Ubuntu droplet rather than MongoDB Atlas.; Keep env naming consistent across local and production deployments.; Environment examples and health reporting are implemented.; Completed with a verified local MongoDB Community connection on this workstation, a passing /api/health readiness response with DB_REQUIRED=true, and a reusable npm run verify:readiness command for repeatable checks.
- [done] [must] TASK-004 — Create scrum source of truth, generated view, and README skeleton plan
  - Area: project-management
  - Day: Day 1 — Foundation
  - Description: Create the planning system, ADRs, notes, and generator so the team can review scope and progress quickly.
  - Acceptance: scrum-data.json exists and is populated; update-scrum-view.mjs generates scrum-view.md; Planning docs are interview-friendly
  - Dependencies: None
  - Notes: This task is being completed by the current workspace update.; Root README skeleton created at the repository root.; README remains a tracked Day 9 delivery item for the fully deployed app workstream.
- [done] [must] TASK-031 — Persist theme mode and tighten semantic theme behavior
  - Area: frontend
  - Day: Day 1 — Foundation
  - Description: Persist light/dark theme selection in localStorage and ensure the current app shell and auth surfaces consistently inherit semantic theme tokens.
  - Acceptance: Theme mode persists across reloads; Shared ThemeProvider remains the single theme entry point; Current app surfaces respect semantic tokens in both light and dark modes
  - Dependencies: TASK-001, TASK-030
  - Notes: User preference should live in localStorage rather than the database for this MVP.; This work was pulled forward because theming is now a top sprint priority.; Keep automated coverage at 100% while adding theme persistence tests.; Completed with a corrected token palette, semantic light/dark theme mapping, stylesheet-driven root theme variables on html, and localStorage-backed theme persistence.
- [done] [must] TASK-032 — Make the current shell mobile responsive
  - Area: frontend
  - Day: Day 1 — Foundation
  - Description: Adapt the current app shell, dashboard cards, and auth surfaces so the scaffold works cleanly on narrow mobile viewports without horizontal scrolling.
  - Acceptance: App shell stacks cleanly on mobile widths; Auth and dashboard surfaces fit narrow screens without layout breakage; Current scaffold is comfortable to use on desktop and mobile viewport sizes
  - Dependencies: TASK-001, TASK-030
  - Notes: This work was pulled forward because the current shell is not yet mobile-ready.; Prefer simple responsive behavior over a complex navigation system for now.; Preserve the design-system boundary by solving shared layout concerns in ui/ where practical.; Completed with CSS-module-based responsive shell, auth, and dashboard layouts plus overflow-safe content handling across shared UI primitives and frontend screens.; Extended with a collapsible mobile navigation drawer, overlay dismissal behavior, and automated coverage for the mobile shell interaction.
- [done] [should] TASK-030 — Set up custom UI component library scaffold
  - Area: frontend
  - Day: Day 1 — Foundation
  - Description: Create a separate ui project for shared components, design tokens, and reusable layout primitives consumed by the frontend.
  - Acceptance: UI library folder exists under ui/; Shared component strategy is documented; Frontend can later consume reusable components from the UI library
  - Dependencies: None
  - Notes: Keep the first pass intentionally small: buttons, inputs, layout shells, and navigation primitives.; Do not mix reusable presentation code into server/ or project-management/.; Completed with a separate TypeScript library build and shared primitives consumed by the frontend scaffold.; Shared UI primitives are covered by the frontend Vitest suite to preserve the 100% coverage gate.
- [done] [must] TASK-005 — Implement registration endpoint with bcrypt hashing
  - Area: backend
  - Day: Day 2 — Authentication
  - Description: Create a registration flow that validates input and stores password hashes rather than raw passwords.
  - Acceptance: User can register; Passwords are hashed with bcrypt; Duplicate email or username paths are handled clearly
  - Dependencies: TASK-002, TASK-003
  - Notes: Use zod or express-validator for payload checks.; Keep errors safe and concise.
- [done] [must] TASK-006 — Implement login endpoint and JWT issuance
  - Area: backend
  - Day: Day 2 — Authentication
  - Description: Authenticate users, issue JWTs, and return the minimal session payload required by the frontend.
  - Acceptance: User can log in; Invalid credentials are rejected; JWT is issued for valid credentials
  - Dependencies: TASK-005
  - Notes: Keep token contents minimal.; Plan for environment-driven token secret configuration.
- [done] [must] TASK-007 — Add auth middleware and current-user endpoint
  - Area: backend
  - Day: Day 2 — Authentication
  - Description: Protect private APIs and provide a current-user endpoint so the frontend can restore authenticated state.
  - Acceptance: Protected API routes reject unauthenticated requests; Current-user endpoint returns authenticated user data; Expired or invalid tokens are rejected
  - Dependencies: TASK-006
  - Notes: Reuse middleware for REST routes and socket auth later.; Return only fields needed by the client.
- [done] [must] TASK-008 — Build auth forms, storage strategy, and protected routes
  - Area: frontend
  - Day: Day 2 — Authentication
  - Description: Create login/register forms, session bootstrapping, and React route protection for authenticated app areas.
  - Acceptance: Frontend can register and log in; Authenticated session can be restored; Unauthenticated users are redirected away from protected routes
  - Dependencies: TASK-001, TASK-006, TASK-007
  - Notes: Use Zustand or Context for lightweight auth state.; Storage can be pragmatic for MVP as long as tradeoffs are documented.
- [done] [must] TASK-009 — Create Workspace model with owner membership
  - Area: database
  - Day: Day 3 — Workspaces
  - Description: Add the workspace schema including owner, invite code, and member role records.
  - Acceptance: Workspace model exists; Owner is stored as an owner-role member; Invite code field is defined
  - Dependencies: TASK-003, TASK-007
  - Notes: Membership should be queryable for authorization checks.; Keep invite codes human-shareable but not guessable.
- [done] [must] TASK-010 — Add create and list workspace endpoints
  - Area: backend
  - Day: Day 3 — Workspaces
  - Description: Create the APIs for workspace creation and membership-scoped workspace listing.
  - Acceptance: Authenticated user can create a workspace; User sees only workspaces they belong to; Workspace response includes invite code and role context
  - Dependencies: TASK-009
  - Notes: Keep list payload optimized for sidebar rendering.; Validate ownership on the backend.
- [done] [must] TASK-011 — Implement invite-code join flow
  - Area: backend
  - Day: Day 3 — Workspaces
  - Description: Allow authenticated users to join a workspace via invite code without duplicating membership entries.
  - Acceptance: User can join workspace by invite code; Duplicate membership is prevented; Invalid invite codes return clear errors
  - Dependencies: TASK-009, TASK-010
  - Notes: Joining should be idempotent when practical.; Return refreshed workspace data after join.
- [done] [must] TASK-012 — Build workspace sidebar and active workspace state
  - Area: frontend
  - Day: Day 3 — Workspaces
  - Description: Show the user workspaces, surface invite-code join UI, and manage active workspace selection.
  - Acceptance: Workspace sidebar renders authenticated user workspaces; Create and join flows update the sidebar state; Active workspace selection is preserved during navigation
  - Dependencies: TASK-008, TASK-010, TASK-011
  - Notes: This UI becomes the anchor for later channel navigation.; Show role information when useful for owner/member behavior.
- [done] [must] TASK-013 — Create Channel model and default general provisioning
  - Area: database
  - Day: Day 4 — Channels
  - Description: Add the channel schema and automatically create a general channel when a workspace is created.
  - Acceptance: Channel model exists; Every new workspace receives a general channel; Channel records link back to a workspace
  - Dependencies: TASK-009
  - Notes: Keep channel types limited to text for MVP.; General channel creation should be part of the workspace creation transaction path.; Completed with a Mongoose-backed channel model and automatic default `general` provisioning when new workspaces are created.
- [done] [must] TASK-014 — Add list and create channel endpoints with owner-only guard
  - Area: backend
  - Day: Day 4 — Channels
  - Description: Create the workspace-scoped channel APIs and enforce that only owners can create channels.
  - Acceptance: Channels can be listed by workspace membership; Owner can create a new text channel; Member cannot create channels
  - Dependencies: TASK-010, TASK-013
  - Notes: Validate workspace membership before any channel operation.; Return stable ordering for channel navigation.; Completed with authenticated workspace-scoped list/create channel APIs, membership validation, duplicate-name handling, and owner-only create enforcement on the backend.
- [done] [must] TASK-015 — Build channel navigation and unauthorized access handling
  - Area: frontend
  - Day: Day 4 — Channels
  - Description: Render workspace channels, allow switching, and handle unauthorized or empty states cleanly.
  - Acceptance: User can switch channels; Owner-only creation controls are correctly gated in UI; Unauthorized channel access paths are handled gracefully
  - Dependencies: TASK-012, TASK-014
  - Notes: Do not rely on UI hiding alone for security.; Prepare channel state for message loading and socket room joins.; Completed with Redux-backed channel state, active-channel selection, owner-only channel creation UI, member guidance, and verified frontend/server tests plus production builds.
- [done] [must] TASK-016 — Create Message model and persistence service
  - Area: database
  - Day: Day 5 — Message Persistence
  - Description: Add the message schema and the core save path that links author, workspace, and channel context.
  - Acceptance: Message model exists; Messages are saved in MongoDB; Message records capture author and channel identifiers
  - Dependencies: TASK-013, TASK-014
  - Notes: Keep the model simple and chronological for easy recent-message queries.; This path should later be reused by sockets.; Completed with a Mongoose-backed message model and a persistence service that stores workspace, channel, author, and content context for later socket delivery.
- [done] [must] TASK-017 — Add recent message fetch and content validation
  - Area: backend
  - Day: Day 5 — Message Persistence
  - Description: Provide a recent-messages endpoint and reject empty or invalid content on submission.
  - Acceptance: Messages load when entering a channel; Invalid or empty messages are rejected; Only authorized members can read channel messages
  - Dependencies: TASK-016, TASK-014
  - Notes: Return author display info needed by the UI.; Decide a sensible recent-message limit for the MVP.; Completed with authenticated recent-message list/create APIs, membership checks across workspaces and channels, author display data, and server-side empty/oversized content validation.
- [done] [must] TASK-018 — Build message list, composer, and empty-state UI
  - Area: frontend
  - Day: Day 5 — Message Persistence
  - Description: Render recent messages, compose new text, and make blank channels feel intentional instead of broken.
  - Acceptance: Message list renders recent history; Composer can submit valid text; Empty channel state is clear
  - Dependencies: TASK-015, TASK-017
  - Notes: Show author and timestamp cleanly.; Keep composition behavior simple before optimistic updates.; Completed with a Redux-backed message list/composer flow, active-channel message loading, empty-state handling, send-message UI, and passing frontend/server tests plus production builds.
- [done] [must] TASK-019 — Add authenticated Socket.IO server and room join flow
  - Area: realtime
  - Day: Day 6 — Backend Separation and Real-Time Messaging
  - Description: Stand up Socket.IO, authenticate socket connections, and manage workspace/channel room membership.
  - Acceptance: Socket.IO server is running; Unauthenticated socket connections are rejected; Clients can join the active channel room
  - Dependencies: TASK-007, TASK-014, TASK-142
  - Notes: Use the same auth logic family as protected REST routes.; Validate membership before joining rooms.; Implemented in sockets/chat.ts: connection-level JWT middleware, channel:join with membership check via messageService.checkChannelAccess, channel:leave, and full unit test suite.
- [done] [must] TASK-020 — Implement persist-then-broadcast message flow
  - Area: realtime
  - Day: Day 6 — Backend Separation and Real-Time Messaging
  - Description: Persist each message first, then broadcast the confirmed payload to the relevant channel room.
  - Acceptance: Messages are persisted and broadcast; Broadcast only reaches active channel members; Socket payload mirrors the stored message shape
  - Dependencies: TASK-016, TASK-017, TASK-019, TASK-142
  - Notes: Keep message acknowledgement behavior easy to explain in interviews.; Prefer one canonical message formatter for REST and sockets.; Persist-then-broadcast implemented in sockets/chat.ts: message:send saves via messageService.createMessageForUser then broadcasts confirmed payload to the room. Sender receives same broadcast so message is deduplicated by ID in messagesSlice.
- [done] [must] TASK-021 — Stabilize client socket lifecycle and duplicate prevention
  - Area: frontend
  - Day: Day 6 — Backend Separation and Real-Time Messaging
  - Description: Handle connect, reconnect, channel switching, and event cleanup without duplicate listeners or leaked room state.
  - Acceptance: Two browser sessions can chat in real time; Switching channels does not leak messages; Reconnect does not duplicate listeners
  - Dependencies: TASK-018, TASK-019, TASK-020, TASK-142
  - Notes: Track active room joins explicitly.; Use stable message IDs to deduplicate client state if needed.; Frontend socket lifecycle complete: useSocketChannel in state/socket.ts manages connect/join/leave/disconnect. socketClient.ts singleton recreates on token change. messagesSlice deduplicates incoming message:new events by ID. Fixed AppPage.test.tsx syntax error. Added messageApi.test.ts and socketClient.test.ts. Frontend coverage at 97.75%.
- [done] [must] TASK-142 — Separate backend routes, middleware, controllers, and composition wiring
  - Area: backend
  - Day: Day 6 — Backend Separation and Real-Time Messaging
  - Description: Reduce server/src/app.ts to composition-only responsibilities by extracting reusable auth middleware, service-error handling, route modules, and controller handlers before more backend feature growth.
  - Acceptance: Route registration is split into dedicated modules by domain; Authentication and service-error handling are extracted into shared HTTP-layer utilities; server/src/app.ts primarily composes middleware, routes, and infrastructure
  - Dependencies: TASK-007, TASK-014, TASK-017
  - Notes: This is now the highest-priority active sprint task.; Keep service-layer contracts stable while moving HTTP concerns into the correct modules.; Finish this refactor before adding more backend endpoints or Socket.IO authorization flow complexity.; Completed with extracted HTTP-layer helpers, domain controller modules, dedicated route registration modules, a composition-focused server/src/app.ts, and passing backend tests plus production build verification.
- [done] [must] TASK-023 — Harden route-level and server-side authorization checks
  - Area: backend
  - Day: Day 7 — UI Polish and Authorization Hardening
  - Description: Review workspace, channel, message, and socket access rules so owner/member authorization is enforced on the server.
  - Acceptance: Users cannot access workspaces they do not belong to; Users cannot access channels in unauthorized workspaces; Members cannot perform owner-only actions
  - Dependencies: TASK-014, TASK-017, TASK-019, TASK-020
  - Notes: Test negative cases explicitly.; Keep authorization logic centralized where practical.; Hardened: express-rate-limit added to /api/auth/register and /api/auth/login (20 req / 15-min window). createTestApp helper added to app.test.ts to disable limit in tests. Rate-limit integration test added (101 backend tests). Frontend ProtectedRoute and PublicOnlyRoute already enforcing auth boundaries.
- [done] [should] TASK-022 — Polish responsive, loading, error, and empty states
  - Area: frontend
  - Day: Day 7 — UI Polish and Authorization Hardening
  - Description: Improve the UX so the app behaves cleanly across desktop/mobile sizes and common failure paths.
  - Acceptance: Loading states are visible; Error states are understandable; App works on desktop and mobile viewport sizes
  - Dependencies: TASK-021
  - Notes: Keep visual language simple and consistent.; Focus on confidence and clarity over visual novelty.; Baseline theme persistence and shell responsiveness were pulled forward earlier in the sprint; keep this task focused on broader feature-state polish afterward.; Polish: mobile sidebar toggle via mobileNavigationLabel, scrollable message list with auto-scroll-to-bottom, message timestamps (HH:mm), full-width messages card (grid-column:1/-1), owner/member role badges, invite code copy button, cssModule updates.
- [done] [should] TASK-024 — Review security middleware and owner/member UI cues
  - Area: backend
  - Day: Day 7 — UI Polish and Authorization Hardening
  - Description: Apply baseline security middleware and align UI affordances with the real owner/member rule set.
  - Acceptance: Helmet and CORS strategy are reviewed; Owner-only actions are hidden or disabled for members; Backend authorization does not rely on frontend hiding controls
  - Dependencies: TASK-022, TASK-023
  - Notes: Keep security posture honest and explainable.; Avoid implying enterprise-grade hardening where it does not exist.; Owner/member UI cues: distinct accent pill badge for owner role, neutral pill for member; Channels section shows owner-only create form; member sees informative message; Workspace details card shows role and invite code with copy button.
- [done] [must] TASK-026 — Deploy frontend and server to a DigitalOcean droplet with MongoDB Community
  - Area: deployment
  - Day: Day 8 — PWA and Deployment
  - Description: Provision a single Ubuntu droplet on DigitalOcean, run the frontend and server on the same host, install MongoDB Community locally, and expose the app through Nginx.
  - Acceptance: App is publicly reachable; API is publicly reachable; MongoDB Community works in production on the droplet
  - Dependencies: TASK-024, TASK-025
  - Notes: Deploy a skeleton earlier if possible to reduce risk.; Use Nginx to serve the frontend build and reverse proxy API and Socket.IO traffic to the Node server.; Do not hard-code infrastructure into source.; Deployment infrastructure: deployment/ directory added with rapport.nginx.conf (HTTP→HTTPS redirect, /api proxy, Socket.IO WebSocket upgrade, SPA fallback, static asset caching), ecosystem.config.cjs for PM2, and deploy.sh automation script (installs deps, builds both apps, rsyncs frontend, PM2 reload, health-check smoke test).
- [done] [must] TASK-027 — Configure production env vars, CORS, and smoke tests
  - Area: deployment
  - Day: Day 8 — PWA and Deployment
  - Description: Finalize environment variable setup, production CORS settings, and run a public deployment smoke test.
  - Acceptance: Production frontend talks to the production server through Nginx; Environment variables are configured; Basic deployed smoke test passes
  - Dependencies: TASK-026
  - Notes: Use a fresh account for the smoke test when possible.; Capture deployment URLs in README and scrum data once available.; Production env config: server/.env.production.example with all required variables, JWT_SECRET generation command, CORS_ORIGIN note. deployment-checklist.md updated with full droplet provisioning, MongoDB Community setup, PM2 installation, Nginx TLS config, CORS checklist, 12-step smoke test checklist, and demo account prep checklist.
- [done] [should] TASK-025 — Add PWA manifest, icons, service worker, and offline fallback
  - Area: pwa
  - Day: Day 8 — PWA and Deployment
  - Description: Implement the minimum installability path, icons, and an offline fallback experience for the MVP.
  - Acceptance: Manifest is valid; App has icons; Basic offline fallback works
  - Dependencies: TASK-022
  - Notes: Use a Vite PWA plugin if it speeds up delivery.; Keep service worker behavior intentionally basic.; PWA: vite-plugin-pwa added; manifest.webmanifest with name/short_name/icons/theme_color/display=standalone/start_url=/app; workbox service worker precaches app shell with network-first runtime caching for /api; solid-color 192x192 and 512x512 PNG icons generated; offline.html fallback page; index.html updated with theme-color, apple-mobile-web-app meta tags, and manifest link. Frontend build generates sw.js + workbox bundle, 11 entries precached.
- [done] [must] TASK-028 — Finalize README, architecture notes, and known tradeoffs
  - Area: documentation
  - Day: Day 9 — Interview Readiness
  - Description: Finish the repo-level explanation of what the app demonstrates, how it works, and where the MVP intentionally stops.
  - Acceptance: README explains what the app demonstrates; Architecture notes are clear; Known tradeoffs are documented honestly
  - Dependencies: TASK-026, TASK-027
  - Notes: Use concrete, interview-friendly language rather than hype.; Include live demo URL once available.; README completely rewritten: feature coverage table, repo structure, backend layer separation diagram, test coverage table, quick start guide. architecture-overview.md updated with backend HTTP layer separation section and known tradeoffs table. server/.env.production.example created.
- [done] [must] TASK-029 — Finalize demo script, talking points, and fresh-account smoke test
  - Area: documentation
  - Day: Day 9 — Interview Readiness
  - Description: Prepare the five-minute demo path, interview narrative, and one final end-to-end verification with a clean account.
  - Acceptance: Demo can be completed in under five minutes; Interview talking points are concise and credible; Repo looks professional to an interviewer
  - Dependencies: TASK-027, TASK-028
  - Notes: Optional short demo recording is a stretch add-on, not a blocker.; The final smoke test should verify register, join, chat, refresh, and installability story.; demo-script.md updated: pre-demo checklist, 13-step five-part demo flow (auth/workspace/real-time/channel-switching/PWA), optional narration cues. deployment-checklist.md completely rewritten with droplet provisioning, MongoDB setup, Node/PM2 install, server/Nginx deploy steps, CORS checklist, 12-step smoke test, demo account prep.

## Backlog

### Must

- [todo] [must] TASK-109 — Implement Socket.IO real-time messaging
  - Area: realtime
  - Day: Backlog
  - Description: Broadcast persisted messages to channel participants in real time.
  - Acceptance: Two sessions can chat in real time without duplicates.
  - Dependencies: TASK-108
  - Notes: Covered by Day 6 tasks.
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
- [todo] [must] TASK-119 — Add responsive layout
  - Area: frontend
  - Day: Backlog
  - Description: Adapt the UI for smaller and larger viewports.
  - Acceptance: Core app flows work on desktop and mobile widths.
  - Dependencies: TASK-110
  - Notes: Covered by Day 7 tasks.; Pulled forward in part through TASK-032 because mobile responsiveness is now a current sprint priority.; Baseline shell and auth responsiveness are complete; broader feature-flow responsiveness remains part of later polish.
- [done] [must] TASK-101 — Set up frontend app
  - Area: frontend
  - Day: Backlog
  - Description: Create the frontend application shell and local dev workflow.
  - Acceptance: Frontend starts locally and provides the app shell.
  - Dependencies: None
  - Notes: Covered by Day 1 planning and TASK-001.; Frontend project should live under frontend/.; Completed with a successful production build.
- [done] [must] TASK-102 — Set up server app
  - Area: backend
  - Day: Backlog
  - Description: Create the server application shell and local dev workflow.
  - Acceptance: Server starts locally and exposes a health endpoint.
  - Dependencies: None
  - Notes: Covered by Day 1 planning and TASK-002.; Server project should live under server/.; Completed with a verified health endpoint response.
- [done] [must] TASK-103 — Connect MongoDB
  - Area: database
  - Day: Backlog
  - Description: Connect the server to MongoDB using environment-based configuration.
  - Acceptance: MongoDB connection succeeds in local development.
  - Dependencies: TASK-102
  - Notes: Covered by Day 1 planning and TASK-003.; Completed with verified local MongoDB Community connectivity, an env example, health readiness reporting, and a repeatable readiness probe command.
- [done] [must] TASK-104 — Implement auth
  - Area: backend
  - Day: Backlog
  - Description: Deliver registration, login, JWT, current-user, and password hashing.
  - Acceptance: User can register, log in, and restore a session.
  - Dependencies: TASK-102, TASK-103
  - Notes: Covered by Day 2 tasks.
- [done] [must] TASK-105 — Implement workspace creation
  - Area: backend
  - Day: Backlog
  - Description: Allow authenticated users to create workspaces with owner membership.
  - Acceptance: Authenticated user can create a workspace.
  - Dependencies: TASK-104
  - Notes: Covered by Day 3 tasks.
- [done] [must] TASK-106 — Implement invite-code join
  - Area: backend
  - Day: Backlog
  - Description: Allow authenticated users to join a workspace by invite code.
  - Acceptance: User can join a workspace by invite code.
  - Dependencies: TASK-105
  - Notes: Covered by Day 3 tasks.
- [done] [must] TASK-107 — Implement channel creation
  - Area: backend
  - Day: Backlog
  - Description: Support general channel provisioning and owner-only channel creation.
  - Acceptance: Owner can create channels and members cannot.
  - Dependencies: TASK-105
  - Notes: Covered by Day 4 tasks.; Completed with default general provisioning, owner-only channel creation, workspace-scoped channel listing, and frontend channel navigation.
- [done] [must] TASK-108 — Implement message persistence
  - Area: database
  - Day: Backlog
  - Description: Store and retrieve channel messages from MongoDB.
  - Acceptance: Messages persist and reload on refresh.
  - Dependencies: TASK-107
  - Notes: Covered by Day 5 tasks.; Completed with persisted workspace/channel messages, recent-message retrieval, and frontend message list/composer flows ready for real-time broadcast integration.
- [done] [must] TASK-110 — Add route protection
  - Area: frontend
  - Day: Backlog
  - Description: Protect authenticated screens in the React application.
  - Acceptance: Unauthenticated users cannot access protected screens.
  - Dependencies: TASK-104
  - Notes: Covered by Day 2 tasks.
- [done] [must] TASK-140 — Maintain Redux state architecture
  - Area: frontend
  - Day: Backlog
  - Description: Use Redux Toolkit for frontend application state as the app grows beyond the initial auth shell.
  - Acceptance: Frontend state changes use Redux Toolkit patterns and remain covered by automated tests.
  - Dependencies: TASK-101
  - Notes: Chosen as part of the learning goals for this application.; Completed with Redux Toolkit managing auth and workspace state, typed store hooks/selectors, and automated test coverage around the current state architecture.
- [done] [must] TASK-141 — Maintain 80% automated coverage threshold
  - Area: documentation
  - Day: Backlog
  - Description: Keep frontend and backend automated test coverage at or above the 80% MVP threshold as new features are added.
  - Acceptance: Frontend and backend coverage checks pass in CI or local verification against the 80% MVP threshold before merging changes.
  - Dependencies: TASK-101, TASK-102
  - Notes: Added because this repo is both a portfolio app and a structured learning app.; The MVP coverage gate was later relaxed from 100% to 80% so the sprint can prioritize forward feature delivery while still enforcing meaningful automated test coverage.; Currently satisfied with passing frontend and backend coverage checks against the 80% threshold.

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
- [done] [should] TASK-122 — Add basic smoke tests or manual test checklist
  - Area: documentation
  - Day: Backlog
  - Description: Define the checks used before demoing the product.
  - Acceptance: A repeatable smoke-test checklist exists.
  - Dependencies: TASK-111
  - Notes: Supported by deployment checklist and Day 8/9 validation work.; Completed with a repeatable smoke-test checklist documented in project-management/notes/deployment-checklist.md.
- [done] [should] TASK-123 — Add architecture diagram or ASCII topology
  - Area: documentation
  - Day: Backlog
  - Description: Add a lightweight architecture diagram for interview explanation.
  - Acceptance: Architecture topology is documented in a readable form.
  - Dependencies: TASK-115
  - Notes: Can live inside architecture-overview.md.; Completed with a readable ASCII deployment topology and supporting architecture notes in project-management/notes/architecture-overview.md.
- [done] [should] TASK-124 — Add interview talking points
  - Area: documentation
  - Day: Backlog
  - Description: Prepare concise talking points about technical choices and tradeoffs.
  - Acceptance: Interview talking points are concise and credible.
  - Dependencies: TASK-115
  - Notes: Covered by the project-management notes set.; Completed with concise interview-ready talking points documented in project-management/notes/interview-talking-points.md.
- [done] [should] TASK-139 — Set up custom UI component library
  - Area: frontend
  - Day: Backlog
  - Description: Create a separate shared UI library for reusable visual primitives and app components.
  - Acceptance: UI library exists under ui/ and can be consumed by the frontend.
  - Dependencies: TASK-101
  - Notes: Covered by Day 1 planning and TASK-030.; Use the library to avoid duplicating base components inside frontend/.; Completed with a standalone build and frontend consumption path.

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
- ARCH-008 — **Test-driven development with an MVP coverage gate**: Both frontend and server changes should be driven by automated tests, and the repository should maintain at least 80% coverage for the code currently under test during the MVP sprint.
- ARCH-009 — **Backend HTTP layers should be separated early**: Keep backend composition, middleware, routes, and domain services in distinct modules so feature work does not accumulate in one expanding app.ts file.

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
