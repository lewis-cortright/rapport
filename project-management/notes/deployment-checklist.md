# Deployment Checklist

## Required Environment Variables

### Server (see `server/.env.production.example`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | `production` | yes |
| `PORT` | Port the Node server binds to (default `4000`) | no |
| `MONGODB_URI` | MongoDB connection URI with application credentials | yes |
| `DB_REQUIRED` | `true` — server refuses to start without a DB connection | yes |
| `JWT_SECRET` | 64-byte hex secret for JWT signing (never reuse the dev value) | yes |
| `CORS_ORIGIN` | Exact production frontend URL (e.g. `https://your-domain.example.com`) | yes |

### Frontend (build-time Vite variables)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Set to `/api` when Nginx proxies on the same host (recommended) |
| `VITE_SOCKET_URL` | Leave empty when on the same host — defaults to the page origin |

---

## Droplet Provisioning

1. Create a DigitalOcean Ubuntu 22.04 LTS droplet (1 vCPU / 1 GB minimum).
2. Add an SSH key during creation.
3. Assign a floating IP or configure DNS for your domain.
4. Enable UFW: allow SSH (22), HTTP (80), and HTTPS (443).

---

## MongoDB Community Setup

```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update && sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod

# Create application user
mongosh --eval "
db = db.getSiblingDB('rapport');
db.createUser({
  user: 'rapport_user',
  pwd: 'STRONG_PASSWORD',
  roles: [{ role: 'readWrite', db: 'rapport' }]
});
"
```

---

## Node.js and PM2 Setup

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
node --version   # ≥ 20.x
pm2 --version
```

---

## Server Deployment Steps

```bash
git clone https://github.com/your-handle/rapport.git /var/www/rapport
cd /var/www/rapport
cp server/.env.production.example server/.env
# Fill in all required values before proceeding:
nano server/.env
chmod +x deployment/deploy.sh
./deployment/deploy.sh
pm2 startup   # run the printed command as root
pm2 save
```

---

## Nginx Setup

```bash
sudo apt-get install -y nginx
sudo snap install certbot --classic
sudo certbot --nginx -d your-domain.example.com
# Edit the domain name in the Nginx config before copying:
sudo cp /var/www/rapport/deployment/rapport.nginx.conf /etc/nginx/sites-available/rapport
sudo ln -s /etc/nginx/sites-available/rapport /etc/nginx/sites-enabled/rapport
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

---

## CORS Checklist

- [ ] `CORS_ORIGIN` in `server/.env` matches the exact deployed frontend URL.
- [ ] Local development origin is handled separately from production.
- [ ] Socket.IO CORS is handled by the `cors` option in `server/src/index.ts`.
- [ ] No wildcard (`*`) policy is left in production.
- [ ] Browser DevTools shows no CORS failures during login or messaging.

---

## Smoke Test Checklist

Run through this flow after every deployment from a fresh browser profile:

- [ ] Open the deployed frontend — app shell loads within 3 s.
- [ ] Register a fresh account or log in.
- [ ] Create a workspace named "Demo" — confirm the default `general` channel exists.
- [ ] Create a second channel `announcements`.
- [ ] Open a second browser tab / session and join by invite code.
- [ ] Select `general` in both sessions and send messages — confirm real-time delivery.
- [ ] Refresh Session A — confirm message persistence.
- [ ] Switch channels — confirm messages do not leak between channels.
- [ ] Log out — confirm redirect to `/login`.
- [ ] `GET /api/health` returns `{ ok: true }`.
- [ ] Mobile Chrome: check for "Add to Home Screen" PWA install prompt.
- [ ] Rate limit: 20+ failed logins in quick succession should return HTTP 429.

---

## Demo Account Checklist

- [ ] One "owner" account with a clean workspace called "Rapport Demo".
- [ ] One "member" account joined by invite code.
- [ ] Both accounts accessible from the deployed environment.
- [ ] Member account cannot create channels (shows informative UI message).
- [ ] Test messages cleaned up or archived before interviews.
- [ ] Invite code noted and tested before the live demo.
