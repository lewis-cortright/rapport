# ADR-0003 — Authentication Strategy

- **Status:** Accepted
- **Date:** 2026-05-20

## Context

The MVP needs user registration, login, protected API routes, protected React routes, and a current-user endpoint. The implementation needs to be secure enough for an interview portfolio project while remaining practical to build and explain within a short timeline.

## Decision

Use JWT-based authentication with bcrypt password hashing for the MVP.

## Why JWT Is Acceptable for This Project

JWT is acceptable here because it provides a simple stateless authentication mechanism that is easy to integrate across the frontend, backend, and Socket.IO connection flow.

For this project, JWT offers a good balance of:

- Implementation speed
- Clear interview explanation
- Compatibility with protected APIs and sockets
- Straightforward deployment on managed hosts

This does not imply that JWT is automatically the best choice for every production system. It is the right choice for this MVP.

## Password Hashing Requirement

Passwords must never be stored in plaintext.

- Use bcrypt for password hashing.
- Validate registration input before persistence.
- Compare hashes on login rather than decrypting stored values.
- Keep the hashing approach explicitly documented in architecture and interview notes.

## Current-User Endpoint

The backend will expose a current-user endpoint so the frontend can restore session state after refresh.

That endpoint should:

- Require a valid JWT
- Return only the user fields needed by the client
- Avoid exposing sensitive internal data

## Protected Routes

Protection is required in two places:

- **Backend:** Private endpoints must reject unauthenticated requests.
- **Frontend:** Protected React routes must redirect unauthenticated users away from app-only views.

Frontend route protection improves UX, but it is not a substitute for backend enforcement.

## Future Hardening Options

If the project were extended beyond the interview MVP, useful hardening steps could include:

- HttpOnly cookie-based session handling
- Token rotation and refresh-token strategy
- Account verification and password reset flows
- Rate limiting and login abuse protections
- Security event logging and audit trails
- More formal secret rotation practices

