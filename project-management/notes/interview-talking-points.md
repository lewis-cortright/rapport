# Interview Talking Points

## 30-Second Summary

I built a deployed MERN stack real-time chat PWA to demonstrate full-stack application design in the MERN ecosystem. It includes JWT authentication, workspace membership, owner/member authorization, text channels, persisted MongoDB messages, Socket.IO real-time delivery, and PWA installability. I intentionally scoped it as a polished vertical slice so I could show production-minded tradeoffs instead of an unfinished clone.

## Architecture Summary

The frontend is a React PWA that handles authentication flows, workspace/channel navigation, and chat UI state. The backend is an Express API that owns authentication, authorization, persistence, and validation. MongoDB stores the durable application state. Socket.IO delivers live channel updates after the message has been persisted successfully.

## Why MERN

- It keeps the stack cohesive for a fast full-stack build.
- JavaScript/TypeScript across client and server improves iteration speed.
- MongoDB is a natural fit for the workspace/channel/message data model.
- The ecosystem is well suited to interview projects and easy to explain.

## Why Socket.IO

- It reduced real-time implementation risk versus building raw WebSockets by hand.
- Rooms map naturally to channels.
- Reconnection behavior matters for a chat demo.
- It integrates cleanly with a Node/Express backend.

## Auth and Authorization

- JWT is used for the MVP because it is fast to implement and easy to explain.
- Passwords are hashed with bcrypt.
- Private API routes require authentication.
- Workspace and channel access is validated server-side.
- Owner-only actions such as channel creation are enforced on the backend, not only hidden in the UI.

## MongoDB Schema Decisions

- `User` stores identity and login-related data.
- `Workspace` stores owner, invite code, and embedded membership roles.
- `Channel` is scoped to a workspace and limited to text channels in the MVP.
- `Message` stores workspace, channel, author, and content references for durable history.

## PWA Decisions

- The MVP focuses on manifest support, icons, installability, and a basic offline fallback.
- The goal is to show product-minded delivery, not a complex offline-first synchronization engine.
- PWA support strengthens the “polished vertical slice” story for interviews.

## Deployment Decisions

- I chose a single Ubuntu droplet on DigitalOcean instead of multiple managed platforms.
- Nginx sits in front of the app, serves the frontend build, and proxies API and Socket.IO traffic to the Node server.
- MongoDB Community is installed on the droplet rather than using MongoDB Atlas.
- The result is a simple monolith deployment that is cheap, practical, and easy to explain in an interview.
- Environment variables still keep the runtime configurable and production-minded.

## Tradeoffs

- I intentionally cut voice, video, DMs, uploads, reactions, and advanced permissions.
- I prioritized a complete deployed workflow over a wider but unfinished feature list.
- I favored simple, explainable engineering choices that fit the interview timeline.

## Future Improvements

- Stronger session management and auth hardening
- Presence and typing indicators
- Message editing and deletion
- Better moderation tooling
- Richer offline behavior
- Broader role and permission controls

