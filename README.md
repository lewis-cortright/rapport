# MERN Real-Time Chat PWA — Rapport

A Discord-inspired real-time team chat progressive web app built with the MERN stack.

## Live URL

> Deploy to your own DigitalOcean droplet using the instructions in `deployment/` and `project-management/notes/deployment-checklist.md`.

## What It Is

Rapport is a focused team chat application — not a full Discord clone. It covers:

- Full-stack MERN application design with clean layer separation
- React + Redux Toolkit front-end architecture
- Express API design with separated controllers, routes, and HTTP utilities
- MongoDB schema modeling (users, workspaces, channels, messages)
- Socket.IO real-time messaging with persist-then-broadcast
- JWT authentication and server-side authorization (REST + Socket.IO)
- PWA installability (Workbox service worker, web manifest, offline fallback)
- Deployment discipline (Nginx, PM2, MongoDB Community on a DigitalOcean droplet)

---

## Quick Start (Local Development)

### Prerequisites

- Node.js ≥ 20
- MongoDB Community running locally on port 27017

### Server

```bash
cd server
cp .env.example .env        # edit JWT_SECRET if desired; defaults work for local dev
npm install
npm run dev                 # http://localhost:4000
```

### Frontend

```bash
cd frontend
# .env.example ships with VITE_API_BASE_URL=/api — the Vite dev server proxies
# /api and /socket.io to localhost:4000 automatically, so no edits are needed.
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### UI Component Library (optional, auto-resolved by the frontend alias)

```bash
cd ui
npm install
```

### Seed demo data (optional)

Start the server first, then in a separate terminal:

```bash
cd server
npm run seed                # registers owner@example.com + member@example.com,
                            # creates the "Rapport" workspace, and seeds messages
```

---

## Feature Coverage

| Area | Status |
|------|--------|
| Registration & Login | ✅ done |
| JWT auth + protected routes | ✅ done |
| Workspaces (create / list / join by invite code) | ✅ done |
| Owner / member role enforcement | ✅ done |
| Channels (create / list / switch) | ✅ done |
| Messages (persist + load recent 50) | ✅ done |
| Socket.IO real-time delivery (persist-then-broadcast) | ✅ done |
| Socket authentication + room join / leave | ✅ done |
| Optimistic message sending (instant feedback + failure restore) | ✅ done |
| Typing indicator (real-time peer broadcast, debounced) | ✅ done |
| Avatar colors (deterministic from username hash) | ✅ done |
| Duplicate message prevention (ID dedup) | ✅ done |
| Rate limiting on auth endpoints | ✅ done |
| PWA manifest + service worker + offline fallback | ✅ done |
| Responsive layout + mobile sidebar | ✅ done |
| Owner/member role badges in UI | ✅ done |
| Message timestamps + auto-scroll to latest | ✅ done |
| Deployment config (Nginx, PM2, deploy script) | ✅ done |
| Seed script (`npm run seed`) | ✅ done |

---

## Repository Structure

```text
frontend/              React + Vite + TypeScript SPA
  src/
    config/            Runtime env helpers (appConfig)
    screens/           Page-level components (AppPage, LoginPage, RegisterPage)
    services/          API clients (authApi, channelApi, messageApi, socketClient)
    state/             Redux slices + React context hooks
    test/              Testing utilities and MSW handlers
server/
  src/
    app.ts             Composition root (services → middleware → routers)
    config/            Environment variable parsing
    controllers/       HTTP request → service-call translators
    http/              Shared middleware and response helpers
    routes/            Express Router modules per domain
    services/          Domain logic (no Express / Socket.IO imports)
    sockets/           Socket.IO connection and chat flow
ui/
  src/
    components/        AppShell, Button, Card, Field, SectionHeading, TextInput
    theme/             ThemeProvider, dark/light token sets
    tokens/            Design token definitions
deployment/
  rapport.nginx.conf   Production Nginx config (TLS, /api proxy, Socket.IO upgrade)
  ecosystem.config.cjs PM2 process config
  deploy.sh            One-command deploy script (build → rsync → PM2 reload)
project-management/
  scrum-data.json      Sprint source of truth
  scrum-view.md        Generated board view
  decisions/           Architecture Decision Records (ADRs)
  notes/               Architecture overview, deployment checklist, walkthrough
```

---

## Backend Layer Separation

`server/src/app.ts` is a thin composition root. The HTTP concerns are layered:

```
app.ts  →  routes/*.ts  →  controllers/*.ts
                    ↘  http/authentication.ts
                    ↘  http/service-errors.ts
                    ↘  http/route-params.ts
                         ↕
                    services/*.ts   (no Express imports)
```

- **`services/`** — domain logic, Mongoose stores, business rules
- **`controllers/`** — translate HTTP request state into service calls
- **`routes/`** — mount controllers on Express routers, apply middleware
- **`http/`** — shared utilities: auth middleware, error mapping, param normalization

---

## Test Coverage

| Project | Test files | Tests | Statements |
|---------|-----------|-------|-----------|
| server  | 9 | 105 | ≥ 99 % |
| frontend | 23 | 119 | ≥ 95 % |

Coverage thresholds enforced at 80% lines / statements / functions / branches.

---

## Explicit Non-Goals (MVP)

Voice/video chat, direct messages, file uploads, message reactions, push notifications, threads, end-to-end encryption, advanced permissions matrix, bots.

---

## Project Management

```bash
# Regenerate the scrum view from scrum-data.json
node project-management/scripts/update-scrum-view.mjs
```

Key files:
- `project-management/scrum-view.md` — sprint board snapshot
- `project-management/notes/architecture-overview.md` — system design and known tradeoffs
- `project-management/notes/walkthrough.md` — feature walkthrough guide
- `project-management/notes/talking-points.md` — architecture and technical Q&A

---

## License

No license has been added yet.
