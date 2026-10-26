import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite configuration for the LingoPro React 19 Single Page Application.
 */
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_SITE_URL: process.env.VITE_SITE_URL || 'https://lingopro.online',
    },
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
    ],
  },
  optimizeDeps: {
    entries: ['index.html'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api/v1': {
        target: process.env.VITE_DOTNET_API_TARGET || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
