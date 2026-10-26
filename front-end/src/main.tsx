import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/App';
import '@/app/globals.css';

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
