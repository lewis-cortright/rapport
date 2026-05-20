# MERN Real-Time Chat PWA

A Discord-inspired real-time team chat PWA being built as an interview portfolio project.

## Project Positioning

This project is intentionally scoped as a polished vertical slice rather than a full Discord clone.

The goal is to demonstrate:

- full-stack MERN application design
- React client architecture
- Express API design
- MongoDB schema modeling
- Socket.IO real-time messaging
- JWT authentication and server-side authorization
- deployment discipline
- interview-ready technical communication

## Planned MVP Scope

### Authentication

- Register
- Login
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Protected React routes
- Current-user endpoint

### Workspaces

- Create workspace
- List workspaces for the authenticated user
- Join workspace by invite code
- Workspace owner role
- Workspace member role

### Channels

- Default `general` channel per workspace
- Create text channel
- List channels by workspace
- Switch active channel
- Owner-only channel creation in the MVP

### Messages

- Send message
- Persist message in MongoDB
- Load recent messages on channel entry
- Real-time delivery with Socket.IO
- Channel-based socket rooms
- Duplicate-message prevention when reconnecting or switching channels

### PWA

- Web manifest
- App icon
- Installability
- Responsive layout
- Offline fallback page
- Basic service worker behavior

### Deployment

- Deployed frontend
- Deployed server
- MongoDB Community installed on the server
- Single Ubuntu droplet on DigitalOcean
- Nginx serving the frontend and proxying API + Socket.IO traffic
- Environment-variable based configuration
- Public demo URL

## Explicit Non-Goals

This nine-day MVP does **not** aim to include:

- voice chat
- video chat
- screen sharing
- direct messages
- message reactions
- file uploads
- image uploads
- advanced permissions matrix
- push notifications
- bots
- threads
- end-to-end encryption
- complex moderation systems
- full Discord clone behavior

## Planned Tech Stack

### Frontend

- React
- Vite
- TypeScript
- React Router
- Socket.IO client
- Zustand or React Context
- Custom UI component library consumed from `ui/`

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- JWT
- bcrypt
- zod or express-validator
- helmet
- cors
- dotenv

### Deployment

- DigitalOcean Ubuntu Droplet
- Nginx
- MongoDB Community
- Single-host monolith deployment

## Planned Repository Structure

The application should stay split into separate top-level projects, with the server living directly below the frontend in the repo layout:

```text
frontend/  # React + Vite client application
server/    # Node + Express + Socket.IO API/server
ui/        # Custom shared UI component library
project-management/
README.md
```

This keeps client, server, and shared presentation concerns isolated while still allowing a single repository for planning, documentation, and coordinated delivery.

## Current Repository Status

At the moment, this repository contains the project-management scaffold and planning documents for the build, plus placeholder top-level directories for the future `frontend/`, `server/`, and `ui/` projects.

Implemented so far:

- source-of-truth sprint data in `project-management/scrum-data.json`
- generated scrum dashboard in `project-management/scrum-view.md`
- scrum view generator in `project-management/scripts/update-scrum-view.mjs`
- architecture notes, ADRs, deployment checklist, demo script, and interview talking points

Application scaffolding is planned next, with the React app living under `frontend/`, the Express/Socket.IO server living under `server/`, and the custom component library living under `ui/`.

## Project Management Files

```text
project-management/
  scrum-data.json
  scrum-view.md
  decisions/
  notes/
  scripts/
```

Key files:

- `project-management/scrum-data.json` — source of truth for sprint planning
- `project-management/scrum-view.md` — generated human-readable status view
- `project-management/scripts/update-scrum-view.mjs` — regenerates the scrum view
- `project-management/notes/architecture-overview.md` — system design summary
- `project-management/notes/demo-script.md` — five-minute interview demo flow

## How to Regenerate the Scrum View

From the repository root:

```powershell
node "project-management\scripts\update-scrum-view.mjs"
```

## High-Level Build Plan

### Day 1 — Foundation

- initialize frontend, server, and shared UI library structure
- connect MongoDB
- add env examples
- establish README and project-management flow

### Day 2 — Authentication

- registration
- login
- JWT issuance
- auth middleware
- protected routes

### Day 3 — Workspaces

- workspace model
- create/list/join workspace flows
- sidebar UI

### Day 4 — Channels

- channel model
- default `general` channel
- owner-only creation
- channel navigation

### Day 5 — Message Persistence

- message model
- store and load recent messages
- message list and composer UI

### Day 6 — Real-Time Messaging

- Socket.IO server/client setup
- authenticated socket connections
- room joins/leaves
- persist-then-broadcast flow

### Day 7 — UI Polish and Authorization Hardening

- responsive layout
- loading, error, and empty states
- build reusable design-system components in the shared UI library
- backend authorization review

### Day 8 — PWA and Deployment

- manifest and service worker setup
- offline fallback
- deploy frontend/server on one droplet
- install and configure MongoDB Community
- configure Nginx reverse proxy and static file serving

### Day 9 — Interview Readiness

- finalize README
- confirm architecture notes and demo script
- smoke test with fresh account
- polish the repo presentation

## Architecture Summary

The intended architecture is:

- a React frontend for auth, workspace/channel navigation, and message UI
- a shared `ui/` component library for reusable design-system primitives and app-level components
- an Express server for authentication, authorization, and API endpoints
- MongoDB for durable user, workspace, channel, and message storage
- Socket.IO for channel-scoped real-time message delivery after persistence succeeds

Planned production deployment is a pragmatic monolith: one Ubuntu droplet on DigitalOcean, Nginx at the edge, the frontend build served from the same host, the Node server behind Nginx, and MongoDB Community installed on the droplet.

A fuller description lives in `project-management/notes/architecture-overview.md`.

## Interview Notes

This project is designed to support interview discussion as much as implementation.

Supporting docs:

- `project-management/notes/interview-talking-points.md`
- `project-management/notes/demo-script.md`
- `project-management/decisions/`

## Next Steps

1. scaffold the frontend application inside `frontend/`
2. scaffold the server application inside `server/`
3. scaffold the shared UI component library inside `ui/`
4. add the health endpoint and MongoDB connection
5. start authentication flows

## License

No license has been added yet.

