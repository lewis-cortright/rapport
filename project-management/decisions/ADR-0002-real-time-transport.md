# ADR-0002 — Real-Time Transport

- **Status:** Accepted
- **Date:** 2026-05-20

## Context

The product needs real-time chat behavior so that two browser sessions can exchange messages immediately inside a shared channel. The project also needs to remain practical to deliver in nine days.

REST alone is suitable for initial message creation and retrieval, but it is not enough for low-latency push delivery between active sessions. A real-time transport layer is required.

## Decision

Use Socket.IO for real-time message delivery because it provides a practical abstraction over WebSockets, reconnection behavior, rooms, and event-based communication suitable for a nine-day interview MVP.

## REST vs WebSocket Distinction

REST remains responsible for request/response workflows and is useful for:

- Authentication endpoints
- Workspace and channel CRUD
- Recent message retrieval
- Initial page hydration and refresh behavior

Socket-based communication is responsible for:

- Live message delivery to active channel participants
- Reconnection handling
- Room membership updates as users switch channels

## Why Socket.IO

Socket.IO is a pragmatic choice for this project because it provides:

- A mature event model
- Automatic reconnection behavior
- Named rooms that map naturally to channels
- Straightforward client/server libraries in the MERN ecosystem
- Faster delivery than implementing raw WebSocket infrastructure from scratch

## Room Strategy

The room strategy is channel-based.

- Each active channel maps to a distinct Socket.IO room.
- A user joins the room for the currently active channel.
- A user leaves the previous channel room before or when switching channels.
- Server-side membership checks are required before room join success.

This approach keeps broadcasts scoped to the relevant conversation and reduces cross-channel leakage.

## Authentication Requirements

Socket connections must not be treated as trusted by default.

- The socket handshake must include authentication context.
- The backend must validate the user identity before accepting the connection.
- Room joins must validate workspace membership and channel access.
- Owner-only actions must remain server-side, not UI-only.

## Message Persistence Before Broadcast

Messages should be persisted before broadcast.

This ensures:

- The database remains the source of truth.
- Refreshing the page shows the same messages that were broadcast live.
- Failed persistence does not create “ghost” real-time messages.
- The interview story remains clean: save first, then fan out.

