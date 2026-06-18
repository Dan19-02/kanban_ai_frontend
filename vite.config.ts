import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The backend (API + Socket.IO) the dev server proxies to. Override with
// BACKEND_URL when running the API on a non-default host/port.
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3000';

// In production the built assets are served by the backend from the same
// origin, so the app always talks to a same-origin `/api` and `/socket.io`.
// In development we proxy those paths to the separately-running backend.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true },
      '/socket.io': { target: BACKEND_URL, changeOrigin: true, ws: true },
    },
  },
  build: {
    // Split rarely-changing vendor code into separate chunks so the CDN can
    // cache them independently across deploys and the initial payload shrinks.
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          motion: ['motion'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
});
