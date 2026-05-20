# Rapport Frontend

This is the React + Vite + TypeScript client application for Rapport.

Current application capabilities:
- app boot with Vite
- route shell for login, register, and protected app views
- Redux-based session state
- integration with the shared UI library in `../ui`
- semantic theme support with light/dark modes
- responsive shell and auth layouts
- Vitest coverage gate at 100%

Structure note:
- frontend app-specific helpers live under `src/config/`

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

