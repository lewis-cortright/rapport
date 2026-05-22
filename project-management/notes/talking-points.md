# Architecture and Technical Notes

## Overview

Rapport is a Discord-inspired real-time team chat PWA built with the MERN stack. Authentication, workspace membership, owner/member authorization, text channels, persisted MongoDB messages, Socket.IO real-time delivery with a typing indicator, deterministic avatar colors, and PWA installability are all covered in the MVP.

## Architecture Summary

The frontend is a React PWA that handles authentication flows, workspace/channel navigation, and chat UI state. The backend is an Express API that owns authentication, authorization, persistence, and validation. MongoDB stores the durable application state. Socket.IO delivers live channel updates after the message has been persisted successfully.

## Why MERN

- It keeps the stack cohesive for a fast full-stack build.
- JavaScript/TypeScript across client and server improves iteration speed.
- MongoDB is a natural fit for the workspace/channel/message data model.
- The ecosystem is widely understood and easy to reason about.

## Why Socket.IO

- Rooms map naturally to channels.
- Reconnection behavior is important for a reliable chat experience.
- Acknowledgements (acks) provide a clean request/response flow over the socket.
- It integrates cleanly with a Node/Express backend without additional infrastructure.

## Auth and Authorization

- JWT is used for the MVP because it is fast to implement and straightforward to reason about.
- Passwords are hashed with bcrypt.
- Private API routes require authentication.
- Workspace and channel access is validated server-side on every request.
- Owner-only actions such as channel creation are enforced on the backend, not just hidden in the UI.

## MongoDB Schema Decisions

- `User` stores identity and login-related data.
- `Workspace` stores owner, invite code, and embedded membership roles.
- `Channel` is scoped to a workspace and limited to text channels in the MVP.
- `Message` stores workspace, channel, author, and content references for durable history.

## Real-Time Features

- Socket.IO rooms map to channels — `channel:join` validates membership, `channel:leave` cleans up on switch.
- Messages are persisted before broadcast so the REST history endpoint and real-time stream stay consistent.
- Typing indicator uses `socket.to(room)` which excludes the sender — no state stored server-side; each client manages auto-stop with a 2.5-second debounce timeout.
- Avatar colors are derived deterministically from a username hash so the same user always gets the same color without any database lookup or user-uploaded assets.

## PWA Decisions

- The MVP focuses on manifest support, icons, installability, and a basic offline fallback.
- Workbox handles service worker generation and app-shell precaching via `vite-plugin-pwa`.
- `NetworkFirst` runtime caching is applied to `/api/**` routes so recent API responses serve from cache when offline.

## Deployment Decisions

- A single Ubuntu droplet on DigitalOcean rather than multiple managed platforms keeps the setup simple and the cost low.
- Nginx serves the frontend build and reverse-proxies API and Socket.IO traffic to the Node server.
- MongoDB Community is installed on the droplet rather than using MongoDB Atlas.
- Environment variables keep the runtime configurable without hard-coding infrastructure.

## Tradeoffs

- Voice/video chat, direct messages, file uploads, reactions, push notifications, and advanced permissions are explicitly out of scope.
- A complete deployed workflow was prioritized over a wider but unfinished feature list.
- Simple, explainable engineering choices were preferred over clever optimizations that would complicate maintenance.

## Known Limitations

- JWTs are stored in `localStorage` — susceptible to XSS; a production hardening pass would move to `httpOnly` cookies.
- No token refresh flow — sessions expire without automatic renewal.
- MongoDB is on the same host as the Node server — fine for this scale, but a separate host would be better for production growth.
- No message pagination beyond the initial 50-message fetch.
- Rate limiting uses in-memory counters — resets on server restart, not suitable for multi-process deployments without a Redis backing store.

