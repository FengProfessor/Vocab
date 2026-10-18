import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the LingoPro React 19 Single Page Application.
 * Only the data API is proxied to the .NET 10 server. Every authentication page (login, sign-up,
 * Google OAuth, logout) lives on the server origin (http://localhost:5000/auth/*) and is never served here.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
