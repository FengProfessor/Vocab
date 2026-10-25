import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite configuration for the LingoPro React 19 Single Page Application.
 * Aliases all Next.js client imports (next/link, next/navigation, next/image, next/dynamic, next/font/google)
 * to pure client-side React Router & browser shims so 100% of /src runs as an API-driven SPA without SSR.
 */
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_SITE_URL: process.env.VITE_SITE_URL || 'https://lingopro.online',
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.VITE_SUPABASE_URL || 'https://jyhdxhqkftirncbstfpe.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.VITE_SUPABASE_ANON_KEY ||
        'sb_publishable_cNsBhEJMkhMDa_2k5MHJCw_I68kPEEf',
    },
  },
  resolve: {
    alias: [
      { find: 'next/link', replacement: path.resolve(__dirname, 'src/shims/next-link.tsx') },
      { find: 'next/navigation', replacement: path.resolve(__dirname, 'src/shims/next-navigation.ts') },
      { find: 'next/image', replacement: path.resolve(__dirname, 'src/shims/next-image.tsx') },
      { find: 'next/dynamic', replacement: path.resolve(__dirname, 'src/shims/next-dynamic.tsx') },
      { find: 'next/font/google', replacement: path.resolve(__dirname, 'src/shims/next-font-google.ts') },
      { find: /^next$/, replacement: path.resolve(__dirname, 'src/shims/next-types.ts') },
      { find: 'react-is', replacement: path.resolve(__dirname, 'src/shims/react-is.ts') },
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
