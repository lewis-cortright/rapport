/**
 * PM2 ecosystem file for the Rapport Chat backend.
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save          # persist the process list across reboots
 *   pm2 startup       # install PM2 as a systemd service
 *   pm2 logs rapport  # stream combined stdout/stderr
 *
 * Environment variables are read from server/.env in production.
 * Ensure that file exists and has all required values before starting.
 */
module.exports = {
  apps: [
    {
      name: 'rapport',
      // The compiled ESM bundle produced by `npm run build` in server/.
      script: './server/dist/index.js',

      // Keep the cwd at the repository root so relative paths resolve correctly.
      cwd: '/var/www/rapport',

      // Interpret the bundle as an ES module (Node 20+).
      node_args: '--experimental-vm-modules',

      // Two instances balance the load across both CPU cores of a basic
      // DigitalOcean droplet while staying within single-host constraints.
      instances: 1,
      exec_mode: 'fork',

      // Restart automatically on unhandled crashes, but not on deliberate
      // SIGSTOP / SIGTERM so deployments do not loop.
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 2000,

      // Inherit the environment from the server/.env file.
      // PM2 does not load dotenv automatically — the application does via
      // its own dotenv.config() call in src/config/env.ts.
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};

