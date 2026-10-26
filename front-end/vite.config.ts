import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite dev/preview middleware plugin that executes any `/src/app/api/<route>/route.ts`
 * handler when requested via `/__local_api/<route>` (used for local JSON dataset loaders
 * such as TOEIC, VSTEP, VNU Bậc 3 test/explain/submit/media-proxy and Roadmap checkpoints).
 */
function lingoProLocalRoutePlugin(): Plugin {
  return {
    name: 'lingopro-local-route-plugin',
    transform(code, id) {
      if (id.endsWith('.json') && code.includes('supabase.co')) {
        return {
          code: code.replace(
            /https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//gi,
            '/storage/v1/object/public/',
          ),
          map: null,
        };
      }
      return null;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        if (!rawUrl.startsWith('/__local_api/')) {
          return next();
        }

        try {
          const apiUrl = rawUrl.replace(/^\/__local_api\//, '/api/');
          const [pathname] = apiUrl.split('?');
          const relRoute = pathname.replace(/^\/api\//, '');
          const routeModulePath = `/src/app/api/${relRoute}/route.ts`;

          const mod = await server.ssrLoadModule(routeModulePath);
          const { NextRequest } = await server.ssrLoadModule('/src/shims/next-server.ts');

          const method = (req.method || 'GET').toUpperCase();
          const handler = mod[method] || mod.GET || mod.POST;
          if (typeof handler !== 'function') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: `Method ${method} not allowed` }));
            return;
          }

          const chunks: Buffer[] = [];
          if (method !== 'GET' && method !== 'HEAD') {
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
          }
          const bodyBuffer = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === 'string') headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(', '));
          }

          const fullUrl = `http://${req.headers.host || 'localhost:5173'}${apiUrl}`;
          const nextReq = new NextRequest(fullUrl, {
            method,
            headers,
            body: bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer : undefined,
          });

          const response: Response = await handler(nextReq);
          res.statusCode = response.status;
          response.headers.forEach((val, key) => {
            res.setHeader(key, val);
          });

          const arrayBuf = await response.arrayBuffer();
          res.end(Buffer.from(arrayBuf));
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : 'Local API execution error';
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: msg }));
        }
      });
    },
  };
}

/**
 * Vite configuration for the LingoPro React 19 Single Page Application.
 * Aliases all Next.js imports (next/link, next/navigation, next/image, next/dynamic, next/font/google, next/server, next/og)
 * to client-side React Router & browser shims so 100% of /src runs as an API-driven SPA without SSR.
 */
export default defineConfig({
  plugins: [react(), lingoProLocalRoutePlugin()],
  define: {
    'process.env': {
      NODE_ENV: process.env.NODE_ENV || 'development',
      NEXT_PUBLIC_SITE_URL: process.env.VITE_SITE_URL || 'https://lingopro.online',
    },
  },
  resolve: {
    alias: [
      { find: 'next/link', replacement: path.resolve(__dirname, 'src/shims/next-link.tsx') },
      { find: 'next/navigation', replacement: path.resolve(__dirname, 'src/shims/next-navigation.ts') },
      { find: 'next/image', replacement: path.resolve(__dirname, 'src/shims/next-image.tsx') },
      { find: 'next/dynamic', replacement: path.resolve(__dirname, 'src/shims/next-dynamic.tsx') },
      { find: 'next/font/google', replacement: path.resolve(__dirname, 'src/shims/next-font-google.ts') },
      { find: 'next/server', replacement: path.resolve(__dirname, 'src/shims/next-server.ts') },
      { find: 'next/og', replacement: path.resolve(__dirname, 'src/shims/next-og.tsx') },
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
