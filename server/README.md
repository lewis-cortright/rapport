# Rapport Server

This is the Express + Socket.IO + TypeScript server scaffold.

Current backend capabilities:
- Express app boot
- security middleware and JSON parsing
- `/api/health` endpoint
- MongoDB connection path with honest readiness reporting
- Socket.IO bootstrap for later channel messaging work
- Vitest coverage gate at 100%

## Scripts

```powershell
npm install
npm run dev
npm run build
npm run verify:readiness
npm run test:coverage
```

## Environment

Copy `.env.example` to `.env` when needed.

- `MONGODB_URI` points to local dev or production MongoDB
- `DB_REQUIRED=true` is the normal local-development setting so startup fails fast when MongoDB is unavailable
- set `DB_REQUIRED=false` only when intentionally working on bootstrap code without a running MongoDB instance

## Local readiness verification

Use the built-in readiness probe after configuring `.env`:

```powershell
npm run verify:readiness
```

The command connects through the real MongoDB service, starts the Express app on an ephemeral local port, calls `/api/health`, prints the response payload, and exits non-zero if readiness fails.

## Testing

- Test runner: Vitest + Supertest
- Coverage requirement: 100%
- New server code should be added with tests first or alongside implementation

