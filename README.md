# MERN Real-Time Chat PWA — Rapport

A Discord-inspired real-time team chat PWA built as an interview portfolio project.

## Live Demo

> Deploy to your own DigitalOcean droplet using the instructions in `deployment/` and `project-management/notes/deployment-checklist.md`.

## Project Positioning

This project is a polished vertical slice — not a full Discord clone. It demonstrates:

- Full-stack MERN application design with clean layer separation
- React + Redux Toolkit front-end architecture
- Express API design with separated controllers, routes, and HTTP utilities
- MongoDB schema modeling (users, workspaces, channels, messages)
- Socket.IO real-time messaging with persist-then-broadcast
- JWT authentication and server-side authorization (REST + Socket.IO)
- PWA installability (Workbox service worker, web manifest, offline fallback)
- Deployment discipline (Nginx, PM2, MongoDB Community on a DigitalOcean droplet)
- Interview-ready technical communication

---

## Quick Start (Local Development)

### Prerequisites

- Node.js ≥ 20
- MongoDB Community running locally on port 27017

### Server

```bash
cd server
cp .env.example .env        # edit JWT_SECRET and MONGODB_URI
npm install
npm run dev                 # http://localhost:4000
```

### Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:4000/api
npm install
npm run dev                 # http://localhost:5173
```

### UI Component Library (optional, auto-resolved by the frontend alias)

```bash
cd ui
npm install
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
| Duplicate message prevention (ID dedup) | ✅ done |
| Rate limiting on auth endpoints | ✅ done |
| PWA manifest + service worker + offline fallback | ✅ done |
| Responsive layout + mobile sidebar | ✅ done |
| Owner/member role badges in UI | ✅ done |
| Message timestamps + auto-scroll to latest | ✅ done |
| Deployment config (Nginx, PM2, deploy script) | ✅ done |

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
  notes/               Architecture overview, deployment checklist, demo script
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

| Project | Statements | Functions | Branches | Lines |
|---------|-----------|-----------|---------|-------|
| server | 100 % | 99 % | 99 % | 100 % |
| frontend | 98 % | 96 % | 97 % | 98 % |

Coverage thresholds enforced at 80% lines / statements / functions / branches.

---

## Explicit Non-Goals (MVP)

Voice/video chat, direct messages, file uploads, message reactions, push notifications, threads, end-to-end encryption, advanced permissions matrix, bots, full Discord clone behavior.

---

## Project Management

```bash
# Regenerate the scrum view from scrum-data.json
node project-management/scripts/update-scrum-view.mjs
```

Key files:
- `project-management/scrum-view.md` — sprint board snapshot
- `project-management/notes/architecture-overview.md` — system design and known tradeoffs
- `project-management/notes/demo-script.md` — five-minute interview demo flow
- `project-management/notes/interview-talking-points.md` — anticipated questions + answers

---

## License

No license has been added yet.
