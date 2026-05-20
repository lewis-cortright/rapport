# Deployment Checklist

## Required Environment Variables

### Server

- `MONGODB_URI`
- `JWT_SECRET`
- `PORT` (or host-provided equivalent)
- `CORS_ORIGIN`

### Frontend

- `VITE_API_BASE_URL`
- `VITE_SOCKET_URL`

## MongoDB Community Setup

- Install MongoDB Community on the Ubuntu droplet.
- Enable and start the MongoDB service.
- Create the application database and least-privilege database user.
- Confirm the server can connect using the configured connection string.
- Store the final connection string in the server environment variables.

## Server Deployment Steps

1. Provision an Ubuntu droplet on DigitalOcean.
2. Install Node.js and any process manager you plan to use.
3. Set server environment variables.
4. Confirm the app can boot and reach MongoDB Community.
5. Verify the health endpoint.
6. Confirm the server is listening on an internal port for Nginx to proxy.

## Frontend Deployment Steps

1. Build the frontend for production.
2. Copy the frontend build output to the droplet.
3. Configure Nginx to serve the frontend build as the public site.
4. Set `VITE_API_BASE_URL` to a same-origin path such as `/api` when possible.
5. Set `VITE_SOCKET_URL` only if you need an explicit override.
6. Open the live URL and verify basic app boot.

## Nginx Checklist

- Nginx serves the frontend build directory.
- `/api` is proxied to the Node server.
- Socket.IO upgrade headers are configured correctly.
- TLS is configured for the public domain.
- Static asset caching does not break fresh deployments.

## CORS Checklist

- Server allows the deployed frontend origin.
- Local development origin is handled separately from production.
- Socket.IO CORS is configured in addition to REST CORS.
- Same-origin production routing through Nginx is preferred when practical.
- No wildcard production policy is left in place accidentally.
- Browser console shows no unexpected CORS failures during login or messaging.

## Smoke Test Checklist

- Open the deployed frontend.
- Register a fresh account or log in.
- Create a workspace.
- Confirm the default `general` channel exists.
- Create a second text channel.
- Open a second browser/session.
- Join by invite code.
- Send a message and confirm real-time delivery.
- Refresh both sessions and confirm message persistence.
- Verify the PWA install prompt/path is available where supported.

## Demo Account Checklist

- Keep one clean owner account ready.
- Keep one clean member account ready if possible.
- Ensure both accounts can access the deployed environment.
- Reset or archive noisy demo data before interviews.
- Verify invite-code join still works before the interview.

