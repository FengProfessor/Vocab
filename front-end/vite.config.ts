import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration for the LingoPro React 19 Single Page Application.
 * The SPA calls the .NET API directly at the absolute URL from the .env.<mode> file (see src/config/appConfig.ts),
 * so no dev proxy is used; the API allows this origin through its CORS policy.
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
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
