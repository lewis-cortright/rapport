import path from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Generate a minimal service worker that caches the app shell for
      // offline use and serves a fallback page when the network is absent.
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        // Serve the offline fallback page when a navigation request fails
        // because the user is disconnected and the page isn't cached yet.
        navigateFallback: null,
        offlineGoogleAnalytics: false,
        runtimeCaching: [
          {
            // Cache API requests in a network-first strategy so real-time
            // data is always preferred but falls back to the cache offline.
            urlPattern: /^https?:\/\/.*\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'rapport-api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }
            }
          }
        ]
      },
      manifest: {
        name: 'Rapport Chat',
        short_name: 'Rapport',
        description: 'Real-time team chat — workspaces, channels, and messages.',
        theme_color: '#ff8300',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/app',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@rapport/ui': path.resolve(__dirname, '../ui/src/index.ts')
    }
  },
  server: {
    port: 5173,
    fs: {
      allow: [path.resolve(__dirname, '..')]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        ws: true
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}', '../ui/src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/test/**/*'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  }
});

