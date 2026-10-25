import React from 'react';
import { createRoot } from 'react-dom/client';
import { installGlobalApiBridge } from '@/lib/auth-fetch';
import { App } from '@/App';
import '@/app/globals.css';

// Install the global /api/* -> .NET 10 /api/v1/* interceptor before mounting any component
installGlobalApiBridge();

/**
 * Mounts the LingoPro React 19 Client-Side SPA into the #root DOM container.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to locate #root container in index.html');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
