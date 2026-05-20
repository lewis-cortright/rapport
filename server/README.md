# Rapport Server

This is the Express + Socket.IO + TypeScript server scaffold.

Current Day 1 scope:
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
npm run test:coverage
```

## Environment

Copy `.env.example` to `.env` when needed.

- `MONGODB_URI` points to local dev or production MongoDB
- `DB_REQUIRED=false` lets the scaffold boot without a running MongoDB instance
- set `DB_REQUIRED=true` when you want startup to fail hard if MongoDB is unavailable

## Testing

- Test runner: Vitest + Supertest
- Coverage requirement: 100%
- New server code should be added with tests first or alongside implementation

