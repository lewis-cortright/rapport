# Rapport Frontend

This is the React + Vite + TypeScript client application.

Current Day 1 scope:
- app boot with Vite
- route shell for login, register, and protected app views
- Redux-based auth placeholder state
- integration with the shared UI library in `../ui`
- Vitest coverage gate at 100%

Current structure note:
- frontend app-specific helpers now live under `src/config/` instead of a generic `src/lib/`

## Scripts

```powershell
npm install
npm run dev
npm run build
npm run test:coverage
```

## Environment

Copy `.env.example` to `.env` when needed.

- `VITE_API_BASE_URL` defaults to `/api`
- `VITE_SOCKET_URL` can stay blank for same-origin production routing through Nginx

## Testing

- Test runner: Vitest + Testing Library
- Coverage requirement: 100%
- New frontend code should be added with tests first or alongside implementation

