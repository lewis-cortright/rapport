# ADR-0004 — MVP Deployment Strategy

- **Status:** Accepted
- **Date:** 2026-05-20

## Context

The project is not interview-ready until it can be opened from a public URL, demonstrated from a clean account, and discussed as a real deployed system. Because the timeline is short, infrastructure choices must optimize for speed, clarity, and reliability rather than custom ops work.

## Decision

Deploy the app as a pragmatic monolith on a single Ubuntu droplet in DigitalOcean. Use Nginx as the public web server and reverse proxy, run the Node/Express + Socket.IO server on the same host, and install MongoDB Community on that droplet.

## Hosting Topology

- One Ubuntu droplet hosts the production environment.
- Nginx terminates public HTTP(S) traffic.
- The frontend build is served from that host.
- The Node server runs behind Nginx.
- Socket.IO traffic is proxied through Nginx to the Node server.
- MongoDB Community runs on the same droplet.

This keeps the deployment topology compact and easy to reason about for an interview MVP.

## Why This Approach

- It reduces platform sprawl and configuration overhead.
- It is cheap and practical for a portfolio deployment.
- It demonstrates basic Linux server and reverse-proxy operations.
- It is easy to explain during an interview because the runtime path is straightforward.

## MongoDB Community

MongoDB Community is the chosen database runtime for production. It will be installed on the droplet and accessed by the server over the local host environment.

This avoids the extra moving parts of a separate hosted database service and keeps the MVP aligned with the chosen single-host deployment model.

## Nginx Responsibilities

- Serve the built frontend assets
- Reverse proxy REST API traffic to the Node server
- Reverse proxy Socket.IO traffic with the correct upgrade headers
- Centralize public routing under one domain

## Environment Variables

Deployment must rely on environment-variable based configuration.

At minimum, production deployment should externalize:

- MongoDB connection string
- JWT secret
- Server port or internal listen port handling
- Allowed frontend origin(s)
- Frontend API base URL
- Frontend Socket.IO URL when same-origin defaults are not sufficient

No environment-specific secrets or URLs should be hard-coded into source files.

## CORS

CORS must be configured intentionally for both REST APIs and Socket.IO connections.

Because the planned production deployment uses one public domain with Nginx in front, a same-origin setup is preferred when practical. Local development origins can be configured separately. This should be validated during deployment smoke testing.

## Deployment Smoke Test

A deployment is only considered usable when the following smoke test passes:

1. Open the public frontend URL.
2. Register or log in.
3. Create a workspace.
4. Create or access the default `general` channel.
5. Open a second session and join via invite code.
6. Send a message and verify real-time delivery.
7. Refresh and confirm message persistence.

This smoke test is part of the product, not a separate ops chore.

