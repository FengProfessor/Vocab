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
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');

          if (normalized.includes('/node_modules/')) {
            if (
              normalized.includes('/node_modules/react/') ||
              normalized.includes('/node_modules/react-dom/') ||
              normalized.includes('/node_modules/react-router') ||
              normalized.includes('/node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (
              normalized.includes('/node_modules/recharts') ||
              normalized.includes('/node_modules/d3-') ||
              normalized.includes('/node_modules/victory-vendor')
            ) {
              return 'vendor-charts';
            }
            if (
              normalized.includes('/node_modules/lucide-react') ||
              normalized.includes('/node_modules/@base-ui/react') ||
              normalized.includes('/node_modules/sonner')
            ) {
              return 'vendor-ui';
            }
            if (
              normalized.includes('/node_modules/@tanstack/react-query') ||
              normalized.includes('/node_modules/axios') ||
              normalized.includes('/node_modules/zustand')
            ) {
              return 'vendor-query';
            }
          }

          if (
            normalized.includes('/src/data/speaking/') ||
            normalized.includes('/src/data/conversations/')
          ) {
            return 'data-speaking';
          }
          if (
            normalized.includes('/src/data/toeic/') ||
            normalized.includes('sat-thu-toeic-listening-data') ||
            normalized.includes('/src/lib/toeic-test-loader')
          ) {
            return 'data-toeic';
          }
          if (
            normalized.includes('/src/data/vstep/') ||
            normalized.includes('/src/data/vnu-bac-3/') ||
            normalized.includes('/src/lib/vstep-test-loader')
          ) {
            return 'data-vstep';
          }
          if (
            normalized.includes('/src/data/grammar') ||
            normalized.includes('/src/lib/grammar-roadmap-data') ||
            normalized.includes('/src/lib/grammar-exercises')
          ) {
            return 'data-grammar';
          }
          if (
            normalized.includes('/src/data/vocab/') ||
            normalized.includes('/src/data/roadmap/') ||
            normalized.includes('/src/lib/vocab-catalog') ||
            normalized.includes('/src/lib/roadmap.ts')
          ) {
            return 'data-vocab';
          }

          return undefined;
        },
      },
    },
  },
});
