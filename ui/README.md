# Rapport UI Library

Shared UI primitives for the chat application live here.

Current scope:
- reusable buttons and cards
- labeled form field helpers
- app-shell layout primitives
- shared section heading patterns
- primitive and semantic design tokens
- a shared `ThemeProvider` for exposing CSS variables to the app
- complementary light and dark semantic themes with runtime mode switching

Structure note:
- shared UI primitives live under `src/components/` to keep them distinct from app-specific helper code in `frontend/`
- tokens live under `src/tokens/`
- the theme wrapper lives under `src/theme/`

## Scripts

```powershell
npm install
npm run build
```

## Notes

- This project stays separate from `frontend/` and `server/`.
- The frontend currently consumes the UI library source through a local alias during development.
- The library also has its own build so it can evolve independently.
- Semantic tokens are derived from the provided brand, neutral, status, spacing, radius, and typography scales.
- Components consume semantic CSS variables instead of hard-coded visual values where practical.

