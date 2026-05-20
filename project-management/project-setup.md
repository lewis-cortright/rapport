# Copilot Instructions — Create Scrum / Project Management System for MERN Real-Time Chat PWA

> Note: This original scaffold brief is preserved for reference. Current deployment decisions have been superseded in the living planning docs (`scrum-data.json`, ADRs, README) and now target a single Ubuntu DigitalOcean droplet with Nginx and MongoDB Community instead of MongoDB Atlas.

## Goal

Create a lightweight but serious project management system for this MERN stack Discord-inspired PWA interview project.

This project is intended to be built, deployed, and demo-ready within nine days for upcoming interviews. The project management structure should match the polished style used in the Babylon Forge project: structured JSON as the source of truth, generated markdown views for human readability, clear sprint goals, acceptance criteria, risks, architecture notes, ADRs, and quality gates.

The app should be treated as a professional full-stack MVP, not a toy clone.

Working project name:

```text
mern-chat-pwa
```

Product positioning:

```text
A real-time team chat PWA built with MongoDB, Express, React, Node, Socket.IO, JWT authentication, role-based workspace/channel access, and MongoDB message persistence.
```

---

## Required Deliverables

Create the following project management structure:

```text
project-management/
  scrum-data.json
  scrum-view.md
  decisions/
    ADR-0001-project-scope.md
    ADR-0002-real-time-transport.md
    ADR-0003-authentication-strategy.md
    ADR-0004-mvp-deployment-strategy.md
  notes/
    interview-talking-points.md
    architecture-overview.md
    deployment-checklist.md
    demo-script.md
  scripts/
    update-scrum-view.mjs
```

If the repository already has an existing `project-management` folder, preserve existing files unless they directly conflict with this structure. Do not delete unrelated work.

---

## Source of Truth Requirement

`project-management/scrum-data.json` must be the source of truth.

`project-management/scrum-view.md` must be generated from:

```text
project-management/scripts/update-scrum-view.mjs
```

Do not make the generated markdown the primary data store.

The generated scrum view should be readable by a human and suitable for quickly reviewing project status before an interview.

---

## scrum-data.json Requirements

Create a consistent, extensible JSON structure in `project-management/scrum-data.json`.

Use this structure:

```json
{
  "project": {
    "name": "mern-chat-pwa",
    "displayName": "MERN Real-Time Chat PWA",
    "type": "Interview Portfolio Project",
    "mission": "Build and deploy a polished MERN stack real-time chat PWA within nine days to demonstrate full-stack engineering ability, React competency, Node/Express API design, MongoDB schema modeling, Socket.IO real-time communication, authentication, authorization, deployment discipline, and interview-ready technical communication.",
    "positioning": "A real-time team chat PWA built with MongoDB, Express, React, Node, Socket.IO, JWT authentication, role-based workspace/channel access, and MongoDB message persistence.",
    "startDate": "",
    "targetDemoDate": "",
    "currentSprintId": "sprint-001",
    "techStack": {
      "frontend": ["React", "Vite", "TypeScript", "React Router"],
      "backend": ["Node.js", "Express"],
      "database": ["MongoDB", "Mongoose"],
      "realtime": ["Socket.IO"],
      "deployment": ["MongoDB Atlas", "Frontend hosting TBD", "Backend hosting TBD"],
      "quality": ["Manual smoke testing", "README", "Demo script", "Architecture notes"]
    }
  },
  "constraints": [],
  "qualityGates": [],
  "architecturePrinciples": [],
  "sprints": [],
  "backlog": [],
  "risks": [],
  "decisions": [],
  "interviewTalkingPoints": [],
  "deployment": {
    "status": "not-started",
    "frontendUrl": "",
    "backendUrl": "",
    "databaseProvider": "MongoDB Atlas",
    "environmentVariables": [],
    "checklist": []
  }
}
```

Populate this file with the initial project plan described below.

---

## Core MVP Scope

The MVP should include only the following features.

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

- Default `general` channel created with each workspace
- Create text channel
- List channels by workspace
- Switch active channel
- Only workspace owner can create channels in the MVP

### Messages

- Send message
- Persist message in MongoDB
- Load recent messages when entering a channel
- Real-time message delivery with Socket.IO
- Channel-based socket rooms
- Avoid duplicate messages when switching channels or reconnecting

### PWA

- Web app manifest
- App icon
- Installable application
- Responsive layout
- Offline fallback page
- Basic service worker behavior

### Deployment

- Deployed frontend
- Deployed backend
- MongoDB Atlas database
- Environment-variable based configuration
- Public demo URL
- Clean README
- Demo script

---

## Explicit Non-Goals for Nine-Day MVP

Add these as constraints or non-goals in `scrum-data.json`:

- No voice chat
- No video chat
- No screen sharing
- No direct messages
- No message reactions
- No file uploads
- No image uploads
- No advanced permissions matrix
- No push notifications
- No bots
- No threads
- No end-to-end encryption
- No complex moderation system
- No attempt to fully clone Discord

The product should be described as “Discord-inspired” or “team-chat inspired,” not as a full Discord replacement.

---

## Suggested Tech Stack

Use these defaults unless the repo already clearly uses different choices.

### Frontend

- React
- Vite
- TypeScript
- React Router
- Socket.IO client
- Zustand or React Context for lightweight app/auth state
- CSS Modules, Tailwind, or plain CSS depending on existing repo setup
- Vite PWA plugin or manual PWA setup

### Backend

- Node.js
- Express
- TypeScript if already configured, otherwise JavaScript is acceptable for speed
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

- MongoDB Atlas
- Render, Railway, Fly.io, DigitalOcean, or similar backend hosting
- Vercel, Netlify, Cloudflare Pages, or similar frontend hosting

The project management files should not force a specific host unless the repo already has deployment decisions.

---

## Initial Data Models to Capture in Architecture Notes

Document these models in:

```text
project-management/notes/architecture-overview.md
```
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

---

## Initial Sprint Plan

Create one nine-day sprint.

```json
{
  "id": "sprint-001",
  "name": "Nine-Day Interview MVP",
  "goal": "Deliver a deployed MERN real-time chat PWA with authentication, workspaces, channels, persisted messages, Socket.IO real-time delivery, PWA installability, and interview-ready documentation.",
  "status": "active",
  "startDate": "",
  "endDate": "",
  "days": []
}
```

Each day should have its own plan.

---

## Day 1 — Foundation

Tasks:

- Initialize repository structure
- Set up frontend app
- Set up backend app
- Add MongoDB connection
- Add environment variable examples
- Add project-management folder
- Add generated scrum view
- Add basic README skeleton

Acceptance criteria:

- Frontend starts locally
- Backend starts locally
- Backend health endpoint works
- MongoDB connection succeeds
- Scrum system can generate `scrum-view.md`

---

## Day 2 — Authentication

Tasks:

- User registration endpoint
- User login endpoint
- Password hashing
- JWT issuing
- Auth middleware
- Current-user endpoint
- Frontend auth forms
- Protected routes

Acceptance criteria:

- User can register
- User can log in
- JWT is stored safely enough for MVP
- Protected API routes reject unauthenticated requests
- Frontend can restore authenticated session

---

## Day 3 — Workspaces

Tasks:

- Workspace model
- Create workspace endpoint
- List user workspaces endpoint
- Join workspace by invite code
- Workspace sidebar UI
- Active workspace state

Acceptance criteria:

- Authenticated user can create a workspace
- Workspace owner is added as owner member
- Workspace has invite code
- User can join workspace by invite code
- User sees only workspaces they belong to

---

## Day 4 — Channels

Tasks:

- Channel model
- Create default `general` channel with workspace
- List channels by workspace
- Create channel endpoint
- Owner-only channel creation guard
- Channel navigation UI

Acceptance criteria:

- Every new workspace has a `general` channel
- User can switch channels
- Owner can create channels
- Member cannot create channels
- Unauthorized channel access is blocked

---

## Day 5 — Message Persistence

Tasks:

- Message model
- Create message endpoint or socket-backed persistence service
- Fetch recent messages by channel
- Message list UI
- Message composer UI
- Basic content validation

Acceptance criteria:

- Messages are saved in MongoDB
- Messages load when entering a channel
- Empty channel state is clear
- Message author and timestamp display correctly
- Invalid or empty messages are rejected

---

## Day 6 — Real-Time Messaging

Tasks:

- Socket.IO server setup
- Authenticated socket connection
- Join workspace/channel room
- Leave previous channel room
- Broadcast new messages to channel
- Client socket lifecycle handling
- Duplicate-message prevention

Acceptance criteria:

- Two browser sessions can chat in real time
- Messages are persisted and broadcast
- Switching channels does not leak messages from other channels
- Reconnect does not duplicate listeners
- Socket auth rejects unauthenticated users

---

## Day 7 — UI Polish and Authorization Hardening

Tasks:

- Responsive layout
- Loading states
- Error states
- Empty states
- Owner/member UI differences
- Route-level authorization checks
- Basic security middleware review

Acceptance criteria:

- App feels demo-ready
- Obvious failure paths are handled
- Owner-only actions are hidden or disabled for members
- Backend authorization does not rely on frontend hiding controls
- App works on desktop and mobile viewport sizes

---

## Day 8 — PWA and Deployment

Tasks:

- Add web manifest
- Add app icon
- Add service worker or Vite PWA setup
- Add offline fallback
- Deploy backend
- Deploy frontend
- Configure MongoDB Atlas
- Configure production environment variables
- Test deployed app

Acceptance criteria:

- App is publicly reachable
- API is publicly reachable
- Production frontend talks to production backend
- MongoDB Atlas connection works
- App can be installed as a PWA
- Basic offline fallback works

---

## Day 9 — Interview Readiness

Tasks:

- Final README
- Architecture overview
- Demo script
- Interview talking points
- Known limitations and future work
- Deployment checklist verification
- Smoke test with fresh test account
- Optional short demo recording

Acceptance criteria:

- README explains what the app demonstrates
- Demo can be completed in under five minutes
- Architecture notes are clear
- Known tradeoffs are documented honestly
- Repo looks professional to an interviewer

---

## Task Object Format

Each task in `scrum-data.json` should use this shape:

```json
{
  "id": "TASK-001",
  "title": "",
  "status": "todo",
  "priority": "must",
  "area": "frontend | backend | database | realtime | pwa | deployment | documentation | project-management",
  "description": "",
  "acceptanceCriteria": [],
  "dependencies": [],
  "notes": []
}
```

Allowed statuses:

```text
todo
in-progress
blocked
done
cut
```

Allowed priorities:

```text
must
should
could
won't
```

---

## Quality Gates

Add these quality gates:

```json
[
  {
    "id": "QG-001",
    "name": "Local development boots cleanly",
    "status": "pending",
    "criteria": [
      "Frontend starts without runtime errors",
      "Backend starts without runtime errors",
      "MongoDB connection succeeds",
      "Health endpoint returns success"
    ]
  },
  {
    "id": "QG-002",
    "name": "Authentication is functional",
    "status": "pending",
    "criteria": [
      "User can register",
      "User can log in",
      "Protected routes reject unauthenticated requests",
      "Authenticated session can be restored"
    ]
  },
  {
    "id": "QG-003",
    "name": "Authorization is enforced server-side",
    "status": "pending",
    "criteria": [
      "Users cannot access workspaces they do not belong to",
      "Users cannot access channels in unauthorized workspaces",
      "Members cannot perform owner-only actions",
      "Socket events validate membership before joining rooms"
    ]
  },
  {
    "id": "QG-004",
    "name": "Real-time messaging works",
    "status": "pending",
    "criteria": [
      "Messages are persisted",
      "Messages broadcast to active channel members",
      "Channel switching does not leak messages",
      "Reconnect does not create duplicate listeners"
    ]
  },
  {
    "id": "QG-005",
    "name": "PWA installability works",
    "status": "pending",
    "criteria": [
      "Manifest is valid",
      "App has icons",
      "App can be installed",
      "Offline fallback works"
    ]
  },
  {
    "id": "QG-006",
    "name": "Deployment is interview-ready",
    "status": "pending",
    "criteria": [
      "Frontend is deployed",
      "Backend is deployed",
      "Database is hosted",
      "Production environment variables are configured",
      "README includes live demo URL"
    ]
  }
]
```

---

## Risks

Add these risks:

```json
[
  {
    "id": "RISK-001",
    "title": "Scope creep",
    "severity": "high",
    "status": "open",
    "mitigation": "Keep the MVP limited to auth, workspaces, channels, persisted real-time messages, PWA installability, and deployment."
  },
  {
    "id": "RISK-002",
    "title": "Real-time complexity delays deployment",
    "severity": "medium",
    "status": "open",
    "mitigation": "Implement REST-based message persistence first, then layer Socket.IO broadcasting over the working persistence path."
  },
  {
    "id": "RISK-003",
    "title": "Deployment issues consume final day",
    "severity": "high",
    "status": "open",
    "mitigation": "Deploy a skeleton version early, then continuously deploy improvements."
  },
  {
    "id": "RISK-004",
    "title": "Overbuilding UI instead of core functionality",
    "severity": "medium",
    "status": "open",
    "mitigation": "Use a simple, clean Discord-inspired layout and prioritize working flows over custom visual complexity."
  },
  {
    "id": "RISK-005",
    "title": "Authorization gaps",
    "severity": "high",
    "status": "open",
    "mitigation": "Validate workspace membership and owner-only actions on the backend and in socket handlers, not only in the UI."
  }
]
```

---

## Architecture Principles

Add these principles:

```json
[
  {
    "id": "ARCH-001",
    "name": "Polished vertical slice over broad clone",
    "description": "The project should demonstrate a complete, deployed, reliable MVP rather than a wide but unfinished Discord clone."
  },
  {
    "id": "ARCH-002",
    "name": "Server-side authorization is mandatory",
    "description": "All workspace, channel, message, and socket access must be validated on the backend."
  },
  {
    "id": "ARCH-003",
    "name": "Persist first, broadcast second",
    "description": "Messages should be saved successfully before being broadcast to other clients."
  },
  {
    "id": "ARCH-004",
    "name": "Deployment is part of the product",
    "description": "The app is not interview-ready until it can be accessed through a public URL and demonstrated from a clean account."
  },
  {
    "id": "ARCH-005",
    "name": "Every feature needs a demo path",
    "description": "Features that cannot be shown clearly in a five-minute interview demo should be cut or deferred."
  }
]
```

---

## ADR Requirements

Create the following ADRs.

### ADR-0001-project-scope.md

Decision:

```text
This project will be a Discord-inspired real-time team chat PWA, not a full Discord clone.
```

Include:

- Context
- Decision
- Consequences
- Non-goals
- Interview value

### ADR-0002-real-time-transport.md

Decision:

```text
Use Socket.IO for real-time message delivery because it provides a practical abstraction over WebSockets, reconnection behavior, rooms, and event-based communication suitable for a nine-day interview MVP.
```

Include:

- REST vs WebSocket distinction
- Why Socket.IO
- Room strategy
- Authentication requirements
- Message persistence before broadcast

### ADR-0003-authentication-strategy.md

Decision:

```text
Use JWT-based authentication with bcrypt password hashing for the MVP.
```

Include:

- Why JWT is acceptable for this project
- Password hashing requirement
- Current-user endpoint
- Protected routes
- Future hardening options

### ADR-0004-mvp-deployment-strategy.md

Decision:

```text
Deploy the frontend, backend, and MongoDB database using managed services suitable for fast interview delivery.
```

Include:

- Frontend hosting
- Backend hosting
- MongoDB Atlas
- Environment variables
- CORS
- Deployment smoke test

---

## Notes Files Requirements

### interview-talking-points.md

Create a concise guide explaining how to talk about the project in an interview.

Include sections:

- 30-second summary
- Architecture summary
- Why MERN
- Why Socket.IO
- Auth and authorization
- MongoDB schema decisions
- PWA decisions
- Deployment decisions
- Tradeoffs
- Future improvements

Use this 30-second summary:

```text
I built a deployed MERN stack real-time chat PWA to demonstrate full-stack application design in the MERN ecosystem. It includes JWT authentication, workspace membership, owner/member authorization, text channels, persisted MongoDB messages, Socket.IO real-time delivery, and PWA installability. I intentionally scoped it as a polished vertical slice so I could show production-minded tradeoffs instead of an unfinished clone.
```

### architecture-overview.md

Include:

- System overview
- Frontend responsibilities
- Backend responsibilities
- MongoDB collections
- Socket.IO event flow
- Authorization flow
- Deployment topology
- Known limitations

### deployment-checklist.md

Include:

- Required environment variables
- MongoDB Atlas setup
- Backend deployment steps
- Frontend deployment steps
- CORS checklist
- Smoke test checklist
- Demo account checklist

### demo-script.md

Create a demo script that can be completed in under five minutes.

Flow:

1. Open deployed app
2. Register or log in
3. Create workspace
4. Show default `general` channel
5. Create a second channel
6. Open second browser/session
7. Join workspace by invite code
8. Send message from one session
9. Show real-time message delivery in the other session
10. Refresh page and show persisted messages
11. Mention PWA installability
12. Mention documented future work

---

## Generated scrum-view.md Requirements

The generated markdown file should include:

```md
# MERN Real-Time Chat PWA — Scrum View

## Mission

## Current Sprint

## Sprint Progress

## Quality Gates

## Today / Next Focus

## In Progress

## Blocked

## Done

## Backlog

## Risks

## Architecture Principles

## Deployment Status

## Interview Talking Points

## Recent Decisions
```

The generator should organize tasks by status.

For each task, show:

```text
- [status] [priority] TASK-ID — title
  - Area:
  - Acceptance:
  - Notes:
```

The generated view should be deterministic, readable, and stable in git diffs.

---

## Script Requirements

Create:

```text
project-management/scripts/update-scrum-view.mjs
```

The script must:

- Read `project-management/scrum-data.json`
- Generate `project-management/scrum-view.md`
- Group tasks by status
- Include current sprint details
- Include quality gates
- Include risks
- Include deployment status
- Include interview talking points
- Handle missing optional fields gracefully
- Use only Node built-in modules unless the repo already has a project-management script dependency
- Be runnable with:

```bash
node project-management/scripts/update-scrum-view.mjs
```

Also add a package script if a root `package.json` exists:

```json
{
  "scripts": {
    "scrum:update": "node project-management/scripts/update-scrum-view.mjs"
  }
}
```

Do not overwrite existing scripts. Add the new script safely.

---

## Initial Backlog

Add these backlog items.

### Must

- Set up frontend app
- Set up backend app
- Connect MongoDB
- Implement auth
- Implement workspace creation
- Implement invite-code join
- Implement channel creation
- Implement message persistence
- Implement Socket.IO real-time messaging
- Add route protection
- Add server-side authorization
- Deploy frontend
- Deploy backend
- Configure MongoDB Atlas
- Write README
- Write demo script

### Should

- Add loading states
- Add error states
- Add responsive layout
- Add PWA manifest
- Add offline fallback
- Add basic smoke tests or manual test checklist
- Add architecture diagram or ASCII topology
- Add interview talking points

### Could

- Add typing indicator
- Add presence indicator
- Add message edit/delete
- Add optimistic message sending
- Add avatar colors
- Add keyboard shortcuts
- Add sample/demo seed data

### Won't for MVP

- Voice chat
- Video chat
- File uploads
- Direct messages
- Push notifications
- Advanced permissions
- Full Discord clone behavior

---

## Acceptance Criteria for This Copilot Task

This Copilot task is complete when:

- `project-management/scrum-data.json` exists and is populated.
- `project-management/scrum-view.md` exists and is generated from the JSON.
- `project-management/scripts/update-scrum-view.mjs` exists and runs successfully.
- ADR files exist.
- Notes files exist.
- Root `package.json` has a `scrum:update` script if applicable.
- The scrum view clearly shows the nine-day MVP plan.
- The project management system is specific to the MERN real-time chat PWA.
- The project management structure is professional enough to show or reference during an interview.

---

## Important Implementation Notes

- Do not build app features as part of this task.
- This task is only for project management scaffolding and documentation.
- Keep markdown clear, direct, and interview-friendly.
- Avoid vague backlog items.
- Use explicit acceptance criteria.
- Prefer practical MVP language over startup-style hype.
- Keep the project positioned as a serious engineering demonstration.
- Preserve existing files when possible.
- Make the generated scrum view stable and easy to diff.